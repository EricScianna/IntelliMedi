import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AreaPersonale.module.css";
import stylesShared from "../shared.module.css";
import type { DatiForm, TipologiaVisita, User, DisponibilitaMedico, Appuntamento, VoceMenu } from "../types";
import { API_URL, FORM_VUOTO } from "../constants";
import { useErrore } from "../hooks/useErrore";
import { useUtente } from "../context/UtenteContext";
import Avvisi from "../components/Avvisi";
import Header from "../components/Header";
import FormDatiUtente from "../components/FormDatiUtente";
import ModificaAnagrafica from "../components/ModificaAnagrafica";
import VisualizzaAnagrafica from "../components/VisualizzaAnagrafica";
import Sidebar from "../components/Sidebar";
import Cards from "../components/Cards";
import ListaUtenti from "../components/ListaUtenti";
import Prenotazioni from "../components/Prenotazioni";

const rottaPerRuolo: Record<string, string> = { Paziente: "Pazienti", Medico: "Medici" };

interface Colonna {
  etichetta: string;
  onNuovo?: () => void;
  tipologiaServizio?: boolean;
  onModificaInLista?: (utente: User) => void;
}

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

//COMPONENTE: AreaPersonale (PascalCase obbligatorio): funzione principale di una pagina React.
//tranne useState, tutto quello che c'è all'interno viene ricreato ad ogni render
//Ogni setState prenota un render, il valore si aggiorna solo al render successivo
function AreaPersonale() {
  const { utente, isPaziente, isMedico, isAdmin, setUtente } = useUtente();
  const ruolo = utente?.ruolo ?? ""; // solo se ti serve ancora 'ruolo' altrove (rottaPerRuolo[ruolo], vociPerRuolo[ruolo]…)

  // Stati per la gestione dei dati users
  const [form, setForm] = useState<DatiForm>(FORM_VUOTO);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [tipologiaVisite, setTipologiaVisite] = useState<TipologiaVisita[] | null>(null);
  const [utenteSelezionato, setUtenteSelezionato] = useState<User | null>(null); //usato dall'amministratore quando seleziona un utente
  // Stati per la gestione degli errori
  const { errore, setErrore } = useErrore();
  // Stati per la gestione della visualizzazione sezioni
  const navigate = useNavigate();
  const [sezioneContent, setSezioneContent] = useState<"contentCards" | "anagrafica" | "prenotazioni" | "recensioni" | "listaUtenti" | "creaMedico">("contentCards");
  const [sezioneAnagrafica, setSezioneAnagrafica] = useState<"visualizza" | "modifica">("visualizza");
  const [sezionePrenotazioni, setSezionePrenotazioni] = useState<"visualizzaPrenotazioni" | "nuovaPrenotazioneCalendario" | "nuovaPrenotazioneAdmin">("visualizzaPrenotazioni");
  const [tipoLista, setTipoLista] = useState(""); //usato dall'amministratore quando seleziona un utente
  const [sidebarChiusa, setSidebarChiusa] = useState(false);
  // Stati per la gestione della lista users
  const USERS_PER_PAGINA = 10;
  const [indicePagina, setIndicePagina] = useState(1);
  const totaleUsers = users?.length ?? 0;
  const totalePagineUtenti = Math.ceil(totaleUsers / USERS_PER_PAGINA);
  const inizioPaginaUtenti = (indicePagina - 1) * USERS_PER_PAGINA;
  const usersPagina = users?.slice(inizioPaginaUtenti, inizioPaginaUtenti + USERS_PER_PAGINA);
  // Stati per la gestione delle prenotazioni
  const [disponibilitaMedico, setDisponibilitaMedico] = useState<DisponibilitaMedico[] | null>(null);
  const [tuttiMedici, setTuttiMedici] = useState<DisponibilitaMedico[] | null>(null);
  const [tuttiPazienti, setTuttiPazienti] = useState<User[] | null>(null);
  const [pazienteSelezionatoId, setPazienteSelezionatoId] = useState("");
  const [mediciTipologia, setMediciTipologia] = useState<DisponibilitaMedico[] | null>(null);
  const [appuntamenti, setAppuntamenti] = useState<Appuntamento[] | null>(null);
  const [isNuovaPrenotazioneAdmin, setNuovaPrenotazioneAdmin] = useState<boolean>(false);
  const [lunediCorrente, setLunediCorrente] = useState<Date>(() => {
    const oggi = new Date();
    const g = oggi.getDay();
    const offset = g === 0 ? 6 : g - 1;
    oggi.setDate(oggi.getDate() - offset);
    return oggi;
  });

  const colonnePerTipo: Record<string, Colonna> = {
    Medici: {
      etichetta: "Medici",
      onNuovo: () => {
        caricaListaTipologiaVisita();
        cambiaModalita("creaMedico");
      },
      tipologiaServizio: true,
      onModificaInLista: (utente) => {
        caricaListaTipologiaVisita().then(() => {
          setUser(utente);
          setFormFromUser(utente);
          setSezioneContent("anagrafica");
          setSezioneAnagrafica("modifica");
        });
      },
    },

    Pazienti: { etichetta: "Pazienti" },
  };

  const visualizzazioneTabella = colonnePerTipo[tipoLista] ?? "";

  const vociPerRuolo: Record<string, VoceMenu[]> = {
    Amministratore: [
      {
        etichetta: "Nuova Prenotazione",
        descrizione: "Crea nuova prenotazione",
        immagine: "bi-calendar",
        link: () => {
          setNuovaPrenotazioneAdmin(true);
          nuovaPrenotazioneAdmin();
        },
      },
      {
        etichetta: "Pazienti",
        descrizione: "Visualizza e gestisci i pazienti del sistema",
        immagine: "bi-people",
        link: () => mostraListaUtenti("Pazienti"),
      },
      {
        etichetta: "Medici",
        descrizione: "Visualizza e gestisci i medici del sistema",
        immagine: "bi-heart-pulse",
        link: () => mostraListaUtenti("Medici"),
      },
    ],
    Paziente: [
      { etichetta: "Anagrafica", descrizione: "Visualizza e modifica i tuoi dati personali", immagine: "bi-person", link: mostraAnagrafica },
      { etichetta: "Prenotazioni", descrizione: "Gestisci le tue prenotazioni", immagine: "bi-calendar", link: () => mostraPrenotazioni(idUtente ?? "") },
    ],
    Medico: [
      { etichetta: "Anagrafica", descrizione: "Visualizza e modifica i tuoi dati personali", immagine: "bi-person", link: mostraAnagrafica },
      { etichetta: "Prenotazioni", descrizione: "Gestisci le tue prenotazioni", immagine: "bi-calendar", link: () => mostraPrenotazioni(idUtente ?? "") },
    ],
  };

  function calcolaIdUtente() {
    if (isNuovaPrenotazioneAdmin) return pazienteSelezionatoId;
    if (ruolo === "Amministratore") return utenteSelezionato?.id.toString();
    return utente?.id;
  }
  const idUtente = calcolaIdUtente();

  const vociSidebar = vociPerRuolo[ruolo] ?? [];
  const colClass = vociSidebar.length > 3 ? "col-5 g-5" : "col-3";
  const nomeVisualizzato = ruolo === "Amministratore" ? "Amministratore" : `${user?.nome} ${user?.cognome}`;

  //creazione headers del metodi CRUD
  const createHeaders = useCallback((hasContentType: boolean) => {
    const headers: Record<string, string> = {
      Authorization: "Bearer " + localStorage.getItem("token"),
    };

    if (hasContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }, []);

  async function nuovaPrenotazioneAdmin() {
    setAppuntamenti([]);
    setNuovaPrenotazioneAdmin(true);
    setPazienteSelezionatoId("");
    setTipoLista(""); // reset, per pulizia
    setUtenteSelezionato(null); // niente utente "vecchio"
    await Promise.all([caricaListaTipologiaVisita(), caricaTuttiMedici(), caricaTuttiPazienti()]);
    setSezionePrenotazioni("nuovaPrenotazioneAdmin");
    setSezioneContent("prenotazioni");
  }

  function oreDisponibiliDelGiorno(giorno: number): number[] {
    // filtra disponibilitaMedico per il giorno richiesto, poi flatMap con generaOrari
    const oreDisponibili = disponibilitaMedico?.filter((d) => d.giorno === giorno).flatMap((d) => generaOrari(d.oraInizio, d.oraFine)) ?? [];
    return oreDisponibili;
  }

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

  const giorniSettimana: Date[] = Array.from({ length: 7 }, (_, i) => {
    const lunediCopia = new Date(lunediCorrente);
    lunediCopia.setDate(lunediCopia.getDate() + i);
    return lunediCopia;
  });

  //ore totali in griglia: 8/19
  const grigliaOre = Array.from({ length: 12 }, (_, i) => i + 8);

  //vecchia intenstazione: async function getGenerico(percorso: string) {
  //ho dovuto rendere stabile getGenerico con useCallback. setErrore è un set (quindi stabile), ma inserito nelle dipendenze perché arriva da un custom hook
  const getGenerico = useCallback(
    async (percorso: string) => {
      const risposta = await fetch(`${API_URL}/api/${percorso}`, {
        method: "GET",
        headers: createHeaders(false),
      });

      if (risposta.ok) return risposta.json();
      setErrore("Dati non validi");
      return false;
    },
    [createHeaders, setErrore],
  );

  async function postUtente() {
    const risposta = await fetch(`${API_URL}/api/${tipoLista}`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({ ...form, username, password }),
    });

    if (risposta.ok) return true;
    setErrore("Utente già esistente o dati non validi");
    return false;
  }

  async function postDisponibilitaMedico(giorno: number, ora: number) {
    // template literal = modo di scrivere stringhe usando i backtick ` (alt+096) invece degli apici ' o ".
    // dentro posso infilare espressioni con ${...}
    const oraInizio = `${ora.toString().padStart(2, "0")}:00:00`;
    const oraFine = `${(ora + 1).toString().padStart(2, "0")}:00:00`;
    const risposta = await fetch(`${API_URL}/api/DisponibilitaMedico`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({ medicoId: idUtente, giorno, oraInizio, oraFine }),
    });

    if (risposta.ok) return true;
    setErrore("Errore nella gestione disponibilità");
    return false;
  }

  async function postAppuntamento(giorno: Date, oraAppuntamento: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null) {
    const nuovaData = new Date(giorno);
    nuovaData.setHours(oraAppuntamento, 0, 0, 0);
    const dataFormattata =
      nuovaData.getFullYear().toString() +
      "-" +
      (nuovaData.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      nuovaData.getDate().toString().padStart(2, "0") +
      "T" +
      nuovaData.getHours().toString().padStart(2, "0") +
      ":00:00";

    const medicoScelto = tuttiMedici?.find((m) => m.medicoId === Number(medicoSelezionatoId));
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

    const risposta = await fetch(`${API_URL}/api/Appuntamenti`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({ data: dataFormattata, tipologiaVisitaId: tipologiaId, PazienteId: Number(idUtente), medicoId }),
    });

    if (risposta.ok) {
      if (medicoSelezionatoId === "") {
        return caricaAppuntamentoPerTipologia(tipologiaSelezionataId ?? "");
      } else {
        return caricaAppuntamentoPerMedico(medicoSelezionatoId ?? "");
      }
    }
    if (!risposta.ok) {
      setErrore(await risposta.text());
      return false;
    }
  }

  async function putGenerico(percorso: string) {
    const risposta = await fetch(`${API_URL}/api/${percorso}`, {
      method: "PUT",
      headers: createHeaders(true),
      body: JSON.stringify(form),
    });

    if (risposta.ok) return true;
    setErrore("Errore nella modifica");
    return false;
  }

  async function deleteGenerico(id: string) {
    const risposta = await fetch(`${API_URL}/api/${id}`, {
      method: "DELETE",
      headers: createHeaders(false),
    });

    if (risposta.ok) return true;
    setErrore("Errore nella cancellazione");
    return false;
  }

  //useCallback: il componente mantiene la funzione tra un render e l'altro, ne crea una nuova solo se cambia una delle dipendenze ([])
  const caricaUser = useCallback(async () => {
    const dati = await getGenerico(`${rottaPerRuolo[ruolo]}/${utente?.id}`);
    setUser(dati);
  }, [ruolo, getGenerico, utente?.id]);

  // useEffect è un hook di React, esegue un effetto collaterale (fetch, log ecc) dopo il render
  // l'array in fondo sono le dipendenze, l'effetto si riesegue solo quando uno di quei valori cambia
  // [] una volta, al montaggio
  // [a, b] quando a oppure b cambiano
  // assente: dopo ogni render
  // "exhaustive-deps" è il nome di una regola di ESLint, elenca tutto ciò che l'effetto usa dal componente, così rigira con i valori aggiornati
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    } else if (ruolo !== "Amministratore") {
      //eslint-disable-next-line react-hooks/set-state-in-effect
      caricaUser();
    }
  }, [navigate, caricaUser, ruolo]);

  function setFormFromUser(utente: User) {
    setForm({
      nome: utente.nome,
      cognome: utente.cognome,
      tipologiaVisite: utente.tipologiaVisite ?? [],
      codiceFiscale: utente.codiceFiscale ?? "",
      sesso: utente.sesso ?? 2,
      dataNascita: utente.dataNascita ?? "",
    });
  }

  function cambiaModalita(sezione: "listaUtenti" | "creaMedico") {
    setSezioneContent(sezione);
    setUsername("");
    setPassword("");
    setForm(FORM_VUOTO);
  }

  function modificaInAnagrafica(utente: User) {
    caricaListaTipologiaVisita().then(() => {
      setFormFromUser(utente);
      setSezioneAnagrafica("modifica");
    });
  }

  async function mostraAnagrafica() {
    caricaUser();
    setSezioneContent("anagrafica");
    setTipoLista(rottaPerRuolo[ruolo]);
  }

  async function mostraListaUtenti(tipoUtente: string) {
    const dati = await getGenerico(`${tipoUtente}`);
    setNuovaPrenotazioneAdmin(false);
    setUsers(dati);
    setIndicePagina(1);
    setSezioneContent("listaUtenti");
    setTipoLista(tipoUtente);
  }

  async function caricaListaTipologiaVisita() {
    const datiTipologiaVisita = await getGenerico("TipologiaVisita");
    setTipologiaVisite(datiTipologiaVisita);
    return datiTipologiaVisita;
  }

  async function creaMedico(e: React.SubmitEvent) {
    e.preventDefault();
    const isSuccess = await postUtente();
    if (isSuccess) mostraListaUtenti(tipoLista);
  }

  async function modificaAnagrafica(e: React.SubmitEvent) {
    e.preventDefault();
    await putGenerico(`${rottaPerRuolo[ruolo]}/${user?.id}`);
    await mostraAnagrafica();
    setSezioneAnagrafica("visualizza");
  }

  async function modificalistaUtenti(e: React.SubmitEvent) {
    e.preventDefault();
    await putGenerico(`${tipoLista}/${user?.id}`);
    mostraListaUtenti(tipoLista);
  }

  async function cancellaUser(id: string) {
    await deleteGenerico(`${tipoLista}/${id}`);
    mostraListaUtenti(tipoLista);
  }

  async function cancellaAppuntamento(giorno: Date, ora: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null) {
    const appuntamentiCella =
      appuntamenti?.filter((a) => {
        const nuovaData = new Date(a.data);
        return nuovaData.getHours() === ora && nuovaData.getFullYear() === giorno.getFullYear() && nuovaData.getMonth() === giorno.getMonth() && nuovaData.getDate() === giorno.getDate();
      }) ?? [];

    const appuntamentoPersonale = appuntamentiCella.find((x) => {
      if (isPaziente || isNuovaPrenotazioneAdmin) return x.pazienteId === Number(idUtente);
      if (isMedico) return x.medicoId === Number(idUtente);
      if (isAdmin && tipoLista === "Pazienti") return x.pazienteId === Number(idUtente);
      if (isAdmin && tipoLista === "Medici") return x.medicoId === Number(idUtente);
      return false; // nessun caso combacia
    });

    if (appuntamentoPersonale) {
      const risposta = await deleteGenerico("Appuntamenti/" + appuntamentoPersonale.id.toString());
      if (risposta) {
        if (isPaziente || (isAdmin && tipoLista === "Pazienti") || isNuovaPrenotazioneAdmin) {
          if (medicoSelezionatoId === "") {
            return caricaAppuntamentoPerTipologia(tipologiaSelezionataId ?? "");
          } else {
            return caricaAppuntamentoPerMedico(medicoSelezionatoId ?? "");
          }
        }
      }

      if (isMedico) caricaAppuntamentoPerMedico(idUtente ?? "");
      if (isAdmin) caricaAppuntamentoPerMedico(idUtente ?? "");
    }
  }

  async function cancellaAppuntamentoById(id: string) {
    await deleteGenerico("Appuntamenti/" + id);
    if (isPaziente || (isAdmin && (tipoLista === "Pazienti" || isNuovaPrenotazioneAdmin))) {
      await caricaAppuntamentoPerPaziente(idUtente ?? "");
    } else {
      await caricaAppuntamentoPerMedico(idUtente ?? "");
    }
  }

  async function caricaDisponibilitaPerMedico(id: string) {
    const dati = await getGenerico(`DisponibilitaMedico/GetAllDays?medicoId=${id}`);
    setDisponibilitaMedico(dati);
  }
  //chiamato dal paziente quando fa la ricerca per tipologia
  async function caricaDisponibilitaPerTipologia(id: string) {
    const dati = await getGenerico(`DisponibilitaMedico/GetByTipologia?tipologiaId=${id}`);
    setDisponibilitaMedico(dati);
  }
  //chiamato dal paziente quando fa la ricerca su tendina
  async function caricaMediciPerTipologia(id: string) {
    const dati = await getGenerico(`DisponibilitaMedico/GetByTipologia?tipologiaId=${id}`);
    setMediciTipologia(dati);
  }
  //chiamato dall'admin quando crea nuova prenotazione senza scegliere tipologia
  async function caricaTuttiMedici() {
    const dati = await getGenerico(`DisponibilitaMedico`);
    setTuttiMedici(dati);
  }
  //chiamato dall'admin quando crea nuova prenotazione
  async function caricaTuttiPazienti() {
    const dati = await getGenerico("Pazienti");
    setTuttiPazienti(dati);
  }
  //chiamato dal paziente quando fa la ricerca per tipologia
  async function caricaAppuntamentoPerTipologia(id: string) {
    const dati = await getGenerico(`Appuntamenti/GetByTipologia?tipologiaId=${id}`);
    setAppuntamenti(dati);
  }
  //chiamato dal medico quando fa la ricerca per medicoId
  async function caricaAppuntamentoPerMedico(id: string) {
    const dati = await getGenerico(`Appuntamenti/GetByMedico?medicoId=${id}`);
    setAppuntamenti(dati);
  }
  //chiamato dal paziente quando fa la ricerca
  async function caricaAppuntamentoPerPaziente(id: string) {
    const dati = await getGenerico(`Appuntamenti/GetByPaziente?pazienteId=${id}`);
    setAppuntamenti(dati);
  }

  async function mostraPrenotazioni(id: string) {
    if (isPaziente || (isAdmin && tipoLista === "Pazienti")) {
      await Promise.all([caricaAppuntamentoPerPaziente(id), caricaListaTipologiaVisita()]);
      setSezionePrenotazioni("visualizzaPrenotazioni");
    }
    if (isMedico || (isAdmin && tipoLista === "Medici")) {
      await Promise.all([caricaDisponibilitaPerMedico(id), caricaAppuntamentoPerMedico(id)]);
      setSezionePrenotazioni("visualizzaPrenotazioni");
    }
    if (isNuovaPrenotazioneAdmin) {
      await Promise.all([caricaAppuntamentoPerPaziente(id), caricaListaTipologiaVisita()]);
      setSezionePrenotazioni("nuovaPrenotazioneAdmin");
    }

    setSezioneContent("prenotazioni");
  }

  function datiCella(giorno: Date, ora: number) {
    //restituisce medicoId del medico disponibile in quel giorno e in quell'ora
    const mediciDisponibiliId = disponibilitaMedico?.filter((d) => d.giorno === giorno.getDay() && Number.parseInt(d.oraInizio) === ora).map((x) => x.medicoId) ?? [];
    //per ogni appuntamento fa una copia, filtra le copie per data, e poi ritorna solo quelli === alla nostra data
    const appuntamentiCella =
      appuntamenti?.filter((a) => {
        const nuovaData = new Date(a.data);
        return nuovaData.getHours() === ora && nuovaData.getFullYear() === giorno.getFullYear() && nuovaData.getMonth() === giorno.getMonth() && nuovaData.getDate() === giorno.getDate();
      }) ?? [];
    return { mediciDisponibiliId, appuntamentiCella };
  }

  function statoCellaPaziente(giorno: Date, ora: number): "mio" | "prenotabile" | "pieno" {
    const { mediciDisponibiliId, appuntamentiCella } = datiCella(giorno, ora);
    //controlla se negli appuntamenti c'è l'id paziente (some restituisce boolean)
    //const mio = appuntamentiCella.some((x) => x.pazienteId === (isPaziente ? Number(utente?.id) : Number(utenteSelezionato?.id)));
    const mio = appuntamentiCella.some((x) => x.pazienteId === Number(idUtente));
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
    const medicoDisponibile = mediciDisponibiliId.includes(isMedico ? Number(utente?.id) : Number(utenteSelezionato?.id));
    if (medicoDisponibile) {
      //controlla se negli appuntamenti c'è l'id paziente (some restituisce boolean)
      const prenotato = appuntamentiCella.some((x) => x.medicoId === (isMedico ? Number(utente?.id) : Number(utenteSelezionato?.id)));
      if (prenotato) return "prenotato";
      else return "prenotabile";
    } else return "na";
  }

  async function gestisciCella(giorno: Date, ora: number) {
    let ok;
    const giornoDisponibile = oreDisponibiliDelGiorno(giorno.getDay()).includes(ora);
    if (giornoDisponibile) {
      const cella = disponibilitaMedico?.find((d) => d.giorno === giorno.getDay() && Number.parseInt(d.oraInizio) === ora);
      if (cella !== undefined) {
        ok = await deleteGenerico("DisponibilitaMedico/" + cella.id.toString());
      }
    } else if (!isPaziente) {
      ok = await postDisponibilitaMedico(giorno.getDay(), ora);
    }
    //caricaDisponibilitaPerMedico solo se andato a buon fine
    if (ok) await caricaDisponibilitaPerMedico(idUtente ?? "");
  }

  async function aggiungiPiuDisponibilita(giorno: number, oraInizio: number, oraFine: number) {
    if (oraInizio > oraFine) {
      setErrore("Inserire un range di orari valido");
      return;
    }
    let ok = false;
    for (let i = oraInizio; i <= oraFine; i++) {
      const giornoDisponibile = oreDisponibiliDelGiorno(giorno).includes(i);
      if (!giornoDisponibile) {
        const esito = await postDisponibilitaMedico(giorno, i);
        if (esito) ok = true; // una volta true, resta true
      }
    }
    if (ok) await caricaDisponibilitaPerMedico(idUtente ?? "");
  }

  function eseguiLogout() {
    localStorage.clear(); // o le singole removeItem
    setUtente(null);
    navigate("/home");
  }

  function toggleSidebar() {
    setSidebarChiusa(!sidebarChiusa);
  }

  return (
    <div className={`d-flex flex-column min-vh-100 ${styles.areaPersonale}`}>
      {/* Profile Header */}
      <Header clickCards={() => setSezioneContent("contentCards")} nomeVisualizzato={nomeVisualizzato} clickLogout={eseguiLogout}></Header>
      {/* Main Content */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <Sidebar sidebarChiusa={sidebarChiusa} clickToggleSidebar={toggleSidebar} vociSidebar={vociSidebar}></Sidebar>
        {/* Content Area */}
        <div className={`flex-grow-1 m-4 ${styles.contentArea}`}>
          <div className="m-4">
            {sezioneContent === "contentCards" && (
              /* Cards */
              <Cards vociSidebar={vociSidebar} colClass={colClass}></Cards>
            )}
            {sezioneContent === "listaUtenti" && (
              <ListaUtenti
                tipoLista={tipoLista}
                totaleUsers={totaleUsers}
                onNuovo={visualizzazioneTabella.onNuovo}
                tipologiaServizio={visualizzazioneTabella.tipologiaServizio}
                usersPagina={usersPagina}
                onModificaInLista={visualizzazioneTabella.onModificaInLista}
                onCancella={cancellaUser}
                inizioPaginaUtenti={inizioPaginaUtenti}
                USERS_PER_PAGINA={USERS_PER_PAGINA}
                indicePagina={indicePagina}
                onCambiaPagina={setIndicePagina}
                totalePagineUtenti={totalePagineUtenti}
                onVisualizzaPrenotazione={(utenteSelezionato) => {
                  mostraPrenotazioni(utenteSelezionato.id.toString());
                  setUtenteSelezionato(utenteSelezionato);
                }}
              ></ListaUtenti>
            )}
            {sezioneContent === "creaMedico" && (
              <div className={` col-lg-6 mb-5 mb-lg-0 p-3 ${stylesShared.cardBorder}`}>
                <div className=" card bg-body-tertiary">
                  <FormDatiUtente
                    titolo="Registra nuovo medico"
                    submitUtente={(contenutoForm) => creaMedico(contenutoForm)}
                    form={form}
                    setForm={setForm}
                    isMostraServizi={true}
                    tipologiaVisite={tipologiaVisite}
                    username={username}
                    password={password}
                    setUsername={setUsername}
                    setPassword={setPassword}
                  >
                    <div className="row">
                      <div className="d-flex justify-content-evenly">
                        <button type="submit" className="btn btn-success btn-block mb-4">
                          Registrati
                        </button>
                        <button type="button" className="btn btn-danger btn-block mb-4" onClick={() => mostraListaUtenti("Medici")}>
                          Annulla
                        </button>
                      </div>
                    </div>
                  </FormDatiUtente>
                </div>
              </div>
            )}
            {sezioneContent === "anagrafica" && (
              /* Anagrafica */
              <div className="row g-0">
                <div className={`col-6 p-3 ${stylesShared.cardBorder}`}>
                  <div className="card">
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      <h5 className="m-2">Anagrafica</h5>
                    </div>
                    {sezioneAnagrafica === "visualizza" && (
                      <VisualizzaAnagrafica utente={user} mostraServizi={ruolo === "Medico"} clickModificaInAnagrafica={modificaInAnagrafica}></VisualizzaAnagrafica>
                    )}
                    {sezioneAnagrafica === "modifica" && (
                      <ModificaAnagrafica
                        submitAnagrafica={(e) => {
                          if (ruolo === "Amministratore") modificalistaUtenti(e);
                          else modificaAnagrafica(e);
                        }}
                        form={form}
                        setForm={setForm}
                        mostraServizi={tipoLista === "Medici"}
                        serviziModificabili={ruolo === "Amministratore"}
                        tipologiaVisite={tipologiaVisite}
                        clickAnnulla={() => (ruolo === "Amministratore" ? setSezioneContent("listaUtenti") : setSezioneAnagrafica("visualizza"))}
                      ></ModificaAnagrafica>
                    )}
                  </div>
                </div>
              </div>
            )}
            {sezioneContent === "prenotazioni" && (
              <Prenotazioni
                onAggiungiFascia={aggiungiPiuDisponibilita}
                giorniSettimana={giorniSettimana}
                onSettimanaPrecedente={settimanaPrecedente}
                onSettimanaSuccessiva={settimanaSuccessiva}
                grigliaOre={grigliaOre}
                isGiornoDisponibile={(giorno, ora) => oreDisponibiliDelGiorno(giorno.getDay()).includes(ora)}
                onClickCasella={(giorno, ora) => gestisciCella(giorno, ora)}
                onCaricaDisponibilitaPerTipologia={caricaDisponibilitaPerTipologia}
                onCaricaDisponibilitaPerMedico={caricaDisponibilitaPerMedico}
                tuttiMedici={tuttiMedici}
                tuttiPazienti={tuttiPazienti}
                onCaricaMediciPerTipologia={caricaMediciPerTipologia}
                mediciTipologia={mediciTipologia}
                tipologiaVisite={tipologiaVisite}
                onPrenota={postAppuntamento}
                onDisdici={cancellaAppuntamento}
                onDisdiciById={cancellaAppuntamentoById}
                onCaricaAppuntamentoPerTipologia={caricaAppuntamentoPerTipologia}
                onCaricaAppuntamentoPerMedico={caricaAppuntamentoPerMedico}
                statoCellaPaziente={(giorno, ora) => statoCellaPaziente(giorno, ora)}
                statoCellaMedico={(giorno, ora) => statoCellaMedico(giorno, ora)}
                utenteSelezionato={utenteSelezionato}
                pazienteSelezionatoId={pazienteSelezionatoId}
                setPazienteSelezionatoId={setPazienteSelezionatoId}
                tipoLista={tipoLista}
                appuntamenti={appuntamenti}
                setSezionePrenotazioni={setSezionePrenotazioni}
                sezionePrenotazioni={sezionePrenotazioni}
                onMostraPrenotazioni={mostraPrenotazioni}
                isNuovaPrenotazioneAdmin={isNuovaPrenotazioneAdmin}
                idUtente={idUtente ?? ""}
              ></Prenotazioni>
            )}
          </div>
          {errore && <Avvisi errore={errore} clickChiudi={() => setErrore("")} />}
        </div>
      </div>
    </div>
  );
}

// ----------------- COMPONENTI -----------------
// function Nome ({destructuring dei parametri. React passa le props}: Readonly<{tipo oggetto. TypeScript. Dopo : descrive la forma del parametro}>)


export default AreaPersonale;
