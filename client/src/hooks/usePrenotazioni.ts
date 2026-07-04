import type { Appuntamento, DisponibilitaMedico, User } from "../types";
import { useState } from "react";
import { post } from "../api";

//riceve in input gli orari del medico e li inserisce in un array
function generaOrari(oraInizio: string, oraFine: string): number[] {
  const inizio = oraInizio.split(":", 1);
  const fine = oraFine.split(":", 1);
  const inizioInt = Number.parseInt(inizio[0]);
  const fineInt = Number.parseInt(fine[0]);
  const arrayOrari: number[] = [];
  for (let i = inizioInt; i < fineInt; i++) {
    arrayOrari.push(i);
  }
  return arrayOrari;
}

export function usePrenotazioni({
  getGenerico,
  idUtente,
  setErrore,
  isPaziente,
  isAdmin,
  tipoLista,
  isNuovaPrenotazioneAdmin,
  deleteGenerico,
}: {
  getGenerico: <T = unknown>(percorso: string) => Promise<T>;
  idUtente: string | undefined;
  setErrore: (errore: string) => void;
  isPaziente: boolean;
  isAdmin: boolean;
  tipoLista: string;
  isNuovaPrenotazioneAdmin: boolean;
  deleteGenerico: (id: string) => Promise<boolean>;
}) {
  const [appuntamenti, setAppuntamenti] = useState<Appuntamento[] | null>(null);
  const [disponibilitaMedico, setDisponibilitaMedico] = useState<DisponibilitaMedico[] | null>(null);
  const [mediciTipologia, setMediciTipologia] = useState<DisponibilitaMedico[] | null>(null);
  const [tuttiMedici, setTuttiMedici] = useState<DisponibilitaMedico[] | null>(null);
  const [tuttiPazienti, setTuttiPazienti] = useState<User[] | null>(null);

  const latoPaziente = isPaziente || (isAdmin && (tipoLista === "Pazienti" || isNuovaPrenotazioneAdmin));
  const idUtenteInt = Number(idUtente);

  /**
   *
   * @param giorno
   * @param oraAppuntamento
   * @param tipologiaSelezionataId
   * @param medicoSelezionatoId
   * @returns
   */
  async function postAppuntamento(giorno: Date, oraAppuntamento: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null): Promise<boolean> {
    //cerca fra tutti i medici se quello scelto esiste. può essere null perché il paziente potrebbe aver scelto la tipologia e non il medico
    const medicoScelto = tuttiMedici?.find((m) => m.medicoId === Number(medicoSelezionatoId));
    //ricava tipologiaId dalla tipololgia, se l'utente l'ha scelta, oppure da un medico
    const tipologiaId = tipologiaSelezionataId ? Number(tipologiaSelezionataId) : medicoScelto?.tipologiaVisitaId;
    if (!tipologiaId) {
      setErrore("Seleziona un servizio o un medico");
      return false;
    }

    const { mediciDisponibiliId, appuntamentiCella } = datiCella(giorno, oraAppuntamento);
    //estrae gli id dei medici occupati
    const mediciOccupati = appuntamentiCella?.map((x) => x.medicoId);
    //controlla se ne esiste almeno uno che NON (!) è incluso
    const medicoId = mediciDisponibiliId.find((m) => !mediciOccupati.includes(m));
    if (!medicoId) {
      setErrore("Nessun medico disponibile");
      return false;
    }

    const dataFormattata = dataISO(giorno) + "T" + oraAppuntamento.toString().padStart(2, "0") + ":00:00";
    try {
      await post("Appuntamenti", { data: dataFormattata, tipologiaVisitaId: tipologiaId, PazienteId: idUtenteInt, medicoId });
      if (medicoSelezionatoId === "") await caricaAppuntamentoPerTipologia(tipologiaSelezionataId ?? "");
      else await caricaAppuntamentoPerMedico(medicoSelezionatoId ?? "");
      return true;
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore nella prenotazione");
      return false;
    }
  }

  async function postDisponibilitaMedico(giorno: number, ora: number, data: string | null = null, disponibile: boolean = true) {
    const oraInizio = `${ora.toString().padStart(2, "0")}:00:00`;
    const oraFine = `${(ora + 1).toString().padStart(2, "0")}:00:00`;
    try {
      await post("DisponibilitaMedico", { medicoId: idUtente, giorno, oraInizio, oraFine, data, disponibile });
      return true;
    } catch {
      setErrore("Errore nella gestione disponibilità");
      return false;
    }
  }

  async function gestisciCella(giorno: Date, ora: number) {
    let ok;
    const data = dataISO(giorno);
    const oraMatch = (d: DisponibilitaMedico) => Number.parseInt(d.oraInizio) === ora;
    const giornoDisponibile = oreDisponibiliDelGiorno(giorno).includes(ora);

    if (giornoDisponibile) {
      // TOGLIERE
      const oneOff = disponibilitaMedico?.find((d) => d.disponibile && d.data === data && oraMatch(d));
      if (oneOff) {
        ok = await deleteGenerico("DisponibilitaMedico/" + oneOff.id.toString()); // era one-off → cancella
      } else {
        ok = await postDisponibilitaMedico(giorno.getDay(), ora, data, false); // era ricorrente → crea eccezione
      }
    } else if (!isPaziente) {
      // AGGIUNGERE
      const eccezione = disponibilitaMedico?.find((d) => !d.disponibile && d.data === data && oraMatch(d));
      if (eccezione) {
        ok = await deleteGenerico("DisponibilitaMedico/" + eccezione.id.toString()); // c'era un'eccezione → toglila (riattiva)
      } else {
        ok = await postDisponibilitaMedico(giorno.getDay(), ora, data, true); // niente → crea one-off
      }
    }
    if (ok) await caricaDisponibilitaPerMedico(idUtente ?? "");
  }

  async function aggiungiPiuDisponibilita(giorno: number, oraInizio: number, oraFine: number) {
    if (oraInizio > oraFine) {
      setErrore("Inserire un range di orari valido");
      return;
    }

    let ok = false;
    for (let i = oraInizio; i <= oraFine; i++) {
      const giornoDisponibile = disponibilitaMedico?.some((d) => d.data == null && d.giorno === giorno && Number.parseInt(d.oraInizio) === i) ?? false;
      if (!giornoDisponibile) {
        const esito = await postDisponibilitaMedico(giorno, i);
        if (esito) ok = true; // una volta true, resta true
      }
    }
    if (ok) await caricaDisponibilitaPerMedico(idUtente ?? "");
  }

  async function cancellaAppuntamento(giorno: Date, ora: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null): Promise<boolean> {
    const { appuntamentiCella } = datiCella(giorno, ora);
    const appuntamentoPersonale = appuntamentiCella.find((x) => {
      return latoPaziente ? x.pazienteId === idUtenteInt : x.medicoId === idUtenteInt;
    });
    if (!appuntamentoPersonale) return false;

    const risposta = await deleteGenerico("Appuntamenti/" + appuntamentoPersonale.id.toString());
    if (!risposta) return false;

    if (latoPaziente) {
      if (medicoSelezionatoId === "") await caricaAppuntamentoPerTipologia(tipologiaSelezionataId ?? "");
      else await caricaAppuntamentoPerMedico(medicoSelezionatoId ?? "");
    } else await caricaAppuntamentoPerMedico(idUtente ?? "");

    return true;
  }

  function datiCella(giorno: Date, ora: number) {
    const data = dataISO(giorno);
    const oraMatch = (d: DisponibilitaMedico) => Number.parseInt(d.oraInizio) === ora;
    // medici che hanno un'eccezione (non disponibili) per questo giorno/ora
    const mediciConEccezione = new Set(disponibilitaMedico?.filter((d) => !d.disponibile && d.data === data && oraMatch(d)).map((d) => d.medicoId) ?? []);
    const mediciDisponibiliId = disponibilitaMedico?.filter((d) => d.disponibile && coincideCol(d, giorno) && oraMatch(d) && !mediciConEccezione.has(d.medicoId)).map((x) => x.medicoId) ?? [];
    //per ogni appuntamento fa una copia, filtra le copie per data, e poi ritorna solo quelli === alla nostra data
    const appuntamentiCella =
      appuntamenti?.filter((a) => {
        const nuovaData = new Date(a.data);
        return nuovaData.getHours() === ora && nuovaData.getFullYear() === giorno.getFullYear() && nuovaData.getMonth() === giorno.getMonth() && nuovaData.getDate() === giorno.getDate();
      }) ?? [];
    return { mediciDisponibiliId, appuntamentiCella };
  }

  async function cancellaAppuntamentoById(id: string) {
    await deleteGenerico("Appuntamenti/" + id);
    if (latoPaziente) await caricaAppuntamentoPerPaziente(idUtente ?? "");
    else await caricaAppuntamentoPerMedico(idUtente ?? "");
  }

  async function caricaDisponibilitaPerMedico(id: string) {
    const dati = await getGenerico<DisponibilitaMedico[]>(`DisponibilitaMedico/GetAllDays?medicoId=${id}`);
    setDisponibilitaMedico(dati);
  }
  //chiamato dal paziente quando fa la ricerca per tipologia
  async function caricaDisponibilitaPerTipologia(id: string) {
    const dati = await getGenerico<DisponibilitaMedico[]>(`DisponibilitaMedico/GetByTipologia?tipologiaId=${id}`);
    setDisponibilitaMedico(dati);
  }
  //chiamato dal paziente quando fa la ricerca su tendina
  async function caricaMediciPerTipologia(id: string) {
    const dati = await getGenerico<DisponibilitaMedico[]>(`DisponibilitaMedico/GetByTipologia?tipologiaId=${id}`);
    setMediciTipologia(dati);
  }
  //chiamato dall'admin quando crea nuova prenotazione senza scegliere tipologia
  async function caricaTuttiMedici() {
    const dati = await getGenerico<DisponibilitaMedico[]>(`DisponibilitaMedico`);
    setTuttiMedici(dati);
  }
  //chiamato dall'admin quando crea nuova prenotazione
  async function caricaTuttiPazienti() {
    const dati = await getGenerico<User[]>(`Pazienti`);
    setTuttiPazienti(dati);
  }
  //chiamato dal paziente quando fa la ricerca per tipologia
  async function caricaAppuntamentoPerTipologia(id: string) {
    const dati = await getGenerico<Appuntamento[]>(`Appuntamenti/GetByTipologia?tipologiaId=${id}`);
    setAppuntamenti(dati);
  }
  //chiamato dal medico quando fa la ricerca per medicoId
  async function caricaAppuntamentoPerMedico(id: string) {
    const dati = await getGenerico<Appuntamento[]>(`Appuntamenti/GetByMedico?medicoId=${id}`);
    setAppuntamenti(dati);
  }
  //chiamato dal paziente quando fa la ricerca
  async function caricaAppuntamentoPerPaziente(id: string) {
    const dati = await getGenerico<Appuntamento[]>(`Appuntamenti/GetByPaziente?pazienteId=${id}`);
    setAppuntamenti(dati);
  }

  const [lunediCorrente, setLunediCorrente] = useState<Date>(() => {
    const oggi = new Date();
    const g = oggi.getDay();
    const offset = g === 0 ? 6 : g - 1;
    oggi.setDate(oggi.getDate() - offset);
    return oggi;
  });

  const giorniSettimana: Date[] = Array.from({ length: 7 }, (_, i) => {
    const lunediCopia = new Date(lunediCorrente);
    lunediCopia.setDate(lunediCopia.getDate() + i);
    return lunediCopia;
  });

  //ore totali in griglia: 8/19
  const grigliaOre = Array.from({ length: 12 }, (_, i) => i + 8);

  function settimanaSuccessiva() {
    const lunediCopia = new Date(lunediCorrente);
    lunediCopia.setDate(lunediCopia.getDate() + 7);
    setLunediCorrente(lunediCopia);
  }

  function settimanaPrecedente() {
    const lunediCopia = new Date(lunediCorrente);
    lunediCopia.setDate(lunediCopia.getDate() - 7);
    setLunediCorrente(lunediCopia);
  }

  function oreDisponibiliDelGiorno(giorno: Date): number[] {
    const data = dataISO(giorno);
    const oreEccezione = new Set(disponibilitaMedico?.filter((d) => !d.disponibile && d.data === data).flatMap((d) => generaOrari(d.oraInizio, d.oraFine)) ?? []);
    return (
      disponibilitaMedico
        ?.filter((d) => d.disponibile && coincideCol(d, giorno))
        .flatMap((d) => generaOrari(d.oraInizio, d.oraFine))
        .filter((ora) => !oreEccezione.has(ora)) ?? []
    );
  }

  function dataISO(giorno: Date): string {
    return `${giorno.getFullYear()}-${String(giorno.getMonth() + 1).padStart(2, "0")}-${String(giorno.getDate()).padStart(2, "0")}`;
  }
  // una disponibilità "copre" la cella se: one-off → stessa data; ricorrente (data null) → stesso giorno-settimana
  function coincideCol(d: DisponibilitaMedico, giorno: Date): boolean {
    return d.data ? d.data === dataISO(giorno) : d.giorno === giorno.getDay();
  }

  function statoCellaPaziente(giorno: Date, ora: number): "mio" | "prenotabile" | "pieno" {
    const { mediciDisponibiliId, appuntamentiCella } = datiCella(giorno, ora);
    //controlla se negli appuntamenti c'è l'id paziente (some restituisce boolean)
    const mio = appuntamentiCella.some((x) => x.pazienteId === idUtenteInt);
    //estrae gli id dei medici occupati
    const mediciOccupati = appuntamentiCella?.map((x) => x.medicoId);
    //controlla se ne esiste almeno uno che NON (!) è incluso
    const prenotabile = mediciDisponibiliId.some((m) => !mediciOccupati.includes(m));
    if (mio) return "mio";
    else if (prenotabile) return "prenotabile";
    else return "pieno";
  }

  function statoCellaMedico(giorno: Date, ora: number): "prenotato" | "prenotabile" | "na" {
    const { mediciDisponibiliId, appuntamentiCella } = datiCella(giorno, ora);
    const medicoDisponibile = mediciDisponibiliId.includes(idUtenteInt);
    if (medicoDisponibile) {
      //controlla se negli appuntamenti c'è l'id paziente (some restituisce boolean)
      const prenotato = appuntamentiCella.some((x) => x.medicoId === idUtenteInt);
      if (prenotato) return "prenotato";
      else return "prenotabile";
    } else return "na";
  }

  return {
    oreDisponibiliDelGiorno,
    statoCellaPaziente,
    statoCellaMedico,
    giorniSettimana,
    grigliaOre,
    settimanaPrecedente,
    settimanaSuccessiva,
    appuntamenti,
    mediciTipologia,
    tuttiMedici,
    tuttiPazienti,
    caricaAppuntamentoPerTipologia,
    caricaAppuntamentoPerMedico,
    caricaAppuntamentoPerPaziente,
    caricaDisponibilitaPerMedico,
    caricaDisponibilitaPerTipologia,
    caricaMediciPerTipologia,
    caricaTuttiMedici,
    caricaTuttiPazienti,
    setAppuntamenti,
    postAppuntamento,
    gestisciCella,
    aggiungiPiuDisponibilita,
    cancellaAppuntamento,
    cancellaAppuntamentoById,
  };
}
