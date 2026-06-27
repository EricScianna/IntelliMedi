import { useState, useEffect, useCallback } from "react";
import { data, useNavigate } from "react-router-dom";
import styles from "./AreaPersonale.module.css";
import stylesShared from "../shared.module.css";
import logo from "../assets/logo2.png";
import type { DatiForm, TipologiaVisita, User, DisponibilitaMedico, Appuntamento } from "../types";
import { API_URL, SESSO_LABELS, FORM_VUOTO, GIORNI_SETTIMANA } from "../constants";
import { useErrore } from "../hooks/useErrore";
import FormDatiUtente from "../components/FormDatiUtente";
import Avvisi from "../components/Avvisi";
import { useUtente } from "../context/UtenteContext";

const rottaPerRuolo: Record<string, string> = { Paziente: "Pazienti", Medico: "Medici" };

interface VoceMenu {
  etichetta: string;
  descrizione: string;
  immagine: string;
  link: () => void;
}

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

// function titoloCella(isPaziente: boolean, giornoDisponibile: boolean): string {
//   if (isPaziente) return giornoDisponibile ? "Clicca per prenotare" : "";
//   return giornoDisponibile ? "Clicca per rimuovere" : "Clicca per rendere disponibile";
// }

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
  const [sezionePrenotazioni, setSezionePrenotazioni] = useState<"visualizzaPrenotazioni" | "nuovaPrenotazione">("visualizzaPrenotazioni");
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
  const [mediciTipologia, setMediciTipologia] = useState<DisponibilitaMedico[] | null>(null);
  const [appuntamenti, setAppuntamenti] = useState<Appuntamento[] | null>(null);
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
      { etichetta: "Pazienti", descrizione: "Visualizza e gestisci i pazienti del sistema", immagine: "bi-people", link: () => mostraListaUtenti("Pazienti") },
      { etichetta: "Medici", descrizione: "Visualizza e gestisci i medici del sistema", immagine: "bi-heart-pulse", link: () => mostraListaUtenti("Medici") },
      { etichetta: "Prenotazioni", descrizione: "Crea nuova prenotazione", immagine: "bi-calendar", link: () => mostraPrenotazioni(idUtente ?? "") },
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

  const idUtente = ruolo === "Amministratore" ? utenteSelezionato?.id.toString() : utente?.id;
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
    const { mediciDisponibiliId, appuntamentiCella } = datiCella(giorno, oraAppuntamento);
    //estrae gli id dei medici occupati
    const mediciOccupati = appuntamentiCella?.map((x) => x.medicoId);
    //controlla se ne esiste almeno uno che NON (!) è incluso
    const medicoId = mediciDisponibiliId.find((m) => !mediciOccupati.includes(m));
    if (!medicoId) {
      setErrore("Nessun medico disponibile");
      return false;
    }

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
    const risposta = await fetch(`${API_URL}/api/Appuntamenti`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({ data: dataFormattata, tipologiaVisitaId: Number(tipologiaSelezionataId), PazienteId: Number(utente?.id), medicoId, descrizione: medicoSelezionatoId }),
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
      if (isPaziente) return x.pazienteId === Number(utente?.id);
      if (isMedico) return x.medicoId === Number(utente?.id);
      if (isAdmin && tipoLista === "Pazienti") return x.pazienteId === Number(utenteSelezionato?.id);
      if (isAdmin && tipoLista === "Medici") return x.medicoId === Number(utenteSelezionato?.id);
      return false; // nessun caso combacia
    });

    if (appuntamentoPersonale) {
      const risposta = await deleteGenerico("Appuntamenti/" + appuntamentoPersonale.id.toString());
      if (risposta) {
        if (isPaziente) {
          if (medicoSelezionatoId === "") {
            return caricaAppuntamentoPerTipologia(tipologiaSelezionataId ?? "");
          } else {
            return caricaAppuntamentoPerMedico(medicoSelezionatoId ?? "");
          }
        }
      }

      if (isMedico) caricaAppuntamentoPerMedico(utente?.id ?? "");
      if (isAdmin) caricaAppuntamentoPerMedico(idUtente ?? "");
    }
  }

  async function cancellaAppuntamentoById(id: string) {
    await deleteGenerico("Appuntamenti/" + id.toString());
    if (isPaziente) await caricaAppuntamentoPerPaziente(utente?.id ?? "");
    if (isMedico) await caricaAppuntamentoPerMedico(utente?.id ?? "");
    if (isAdmin && tipoLista === "Pazienti") await caricaAppuntamentoPerPaziente(utenteSelezionato?.id.toString() ?? "");
    if (isAdmin && tipoLista === "Medici") await caricaAppuntamentoPerMedico(utenteSelezionato?.id.toString() ?? "");
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
  //chiamato dal medico quando fa la ricerca per medicoId
  async function caricaAppuntamentoPerPaziente(id: string) {
    const dati = await getGenerico(`Appuntamenti/GetByPaziente?pazienteId=${id}`);
    setAppuntamenti(dati);
  }

  async function mostraPrenotazioni(id: string) {
    if (isPaziente || (isAdmin && tipoLista === "Pazienti")) {
      await Promise.all([caricaAppuntamentoPerPaziente(id), caricaListaTipologiaVisita()]);
    }
    if (isMedico || (isAdmin && tipoLista === "Medici")) {
      await Promise.all([caricaDisponibilitaPerMedico(id), caricaAppuntamentoPerMedico(id)]);
    }
    // if (isAdmin) {
    //   if (tipoLista === "Medici") {
    //     await Promise.all([caricaDisponibilitaPerMedico(id), caricaAppuntamentoPerMedico(id)]);
    //   }
    //   if (tipoLista === "Pazienti") {
    //     await Promise.all([caricaAppuntamentoPerPaziente(id), caricaListaTipologiaVisita()]);
    //   }
    // }
    setSezionePrenotazioni("visualizzaPrenotazioni");
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
    const mio = appuntamentiCella.some((x) => x.pazienteId === (isPaziente ? Number(utente?.id) : Number(utenteSelezionato?.id)));
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
    console.log("quiz");
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
                grigliaOre={grigliaOre}
                isGiornoDisponibile={(giorno, ora) => oreDisponibiliDelGiorno(giorno.getDay()).includes(ora)}
                onClickCasella={(giorno, ora) => gestisciCella(giorno, ora)}
                onCaricaDisponibilitaPerTipologia={caricaDisponibilitaPerTipologia}
                onCaricaDisponibilitaPerMedico={caricaDisponibilitaPerMedico}
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
                tipoLista={tipoLista}
                appuntamenti={appuntamenti}
                setSezionePrenotazioni={setSezionePrenotazioni}
                sezionePrenotazioni={sezionePrenotazioni}
                onMostraPrenotazioni={mostraPrenotazioni}
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
function Header({ clickCards, nomeVisualizzato, clickLogout }: Readonly<{ clickCards: () => void; nomeVisualizzato: string; clickLogout: () => void }>) {
  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg text-white" aria-label="Header">
        <div className="container-fluid">
          <button className="btn navbar-brand" onClick={clickCards}>
            <img src={logo} alt="Logo" width="50" height="44" />
          </button>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <div className="d-flex align-items-center gap-2 ms-5 fs-4">
              <span>Area riservata di {nomeVisualizzato}</span>
            </div>
            <ul className="navbar-nav mb-2 mb-lg-0 ms-auto">
              <li className="nav-item ">
                <button className="nav-link fw-bold text-white" onClick={clickLogout}>
                  LOGOUT<i className="bi bi-door-open ms-2" style={{ fontSize: "2rem" }}></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
function Sidebar({ sidebarChiusa, clickToggleSidebar, vociSidebar }: Readonly<{ sidebarChiusa: boolean; clickToggleSidebar: () => void; vociSidebar: VoceMenu[] }>) {
  return (
    <nav className={`${styles.sidebar} flex-shrink-0 p-3 ${sidebarChiusa ? "collapsed" : ""}`} aria-label="Sidebar">
      <button className={`toggle-btn btn ${styles.toggleBtn}`} onClick={clickToggleSidebar}>
        <i className="bi bi-chevron-double-left fs-4"></i>
      </button>
      <div className={`nav flex-column mt-3 ${styles.menuSidebar}`}>
        {vociSidebar.map((voce) => (
          <button
            key={voce.etichetta}
            className={`d-flex align-items-center btn ${styles.sidebarLink} text-decoration-none p-3 fs-5`}
            onClick={() => {
              voce.link();
            }}
          >
            <i className={`bi ${voce.immagine} me-3`}></i>
            <span className={`${styles.hideOnCollapse}`}>{voce.etichetta}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
function Cards({ vociSidebar, colClass }: Readonly<{ vociSidebar: VoceMenu[]; colClass: string }>) {
  return (
    <div className="row justify-content-evenly">
      {vociSidebar.map((voce) => (
        <div key={voce.etichetta} className={`${colClass} p-3 ${stylesShared.cardBorder}`}>
          <button className="btn p-0 w-100 border-0" onClick={voce.link}>
            <div className={`card p-0 ${styles.cardContent}`}>
              <div className={`card-header text-white ${styles.titleMedisport}`}>
                <h4 className="card-title text-center">{voce.etichetta}</h4>
              </div>
              <figure className="card-img-top text-center m-0">
                <i className={`${styles.cardImmagine} bi ${voce.immagine} d-block`}></i>
              </figure>
              <div className="card-body bg-white text-center py-2">
                <p className="card-text">{voce.descrizione}</p>
              </div>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
function ListaUtenti({
  tipoLista,
  totaleUsers,
  onNuovo,
  tipologiaServizio,
  usersPagina,
  onModificaInLista,
  onCancella,
  inizioPaginaUtenti,
  USERS_PER_PAGINA,
  indicePagina,
  onCambiaPagina,
  totalePagineUtenti,
  onVisualizzaPrenotazione,
}: Readonly<{
  tipoLista: string;
  totaleUsers: number;
  onNuovo?: () => void;
  tipologiaServizio?: boolean;
  usersPagina: User[] | undefined;
  onModificaInLista?: (user: User) => void;
  onCancella: (idUtente: string) => void;
  inizioPaginaUtenti: number;
  USERS_PER_PAGINA: number;
  indicePagina: number;
  onCambiaPagina: (numeroPagina: number) => void;
  totalePagineUtenti: number;
  onVisualizzaPrenotazione: (utenteSelezionato: User) => void;
}>) {
  return (
    <div className="row g-0">
      <div className={`p-3  ${stylesShared.cardBorder}`}>
        <div className={`card ${styles.projectListTableColor}`}>
          <div className={`card-header text-white ${styles.titleMedisport}`}>
            <div className="row">
              <div className="col-6">
                <h5 className="m-2">
                  Lista {tipoLista} ({totaleUsers})
                </h5>
              </div>
              <div className="col-6 d-flex justify-content-end">
                {onNuovo && (
                  <button className="btn btn-success" onClick={onNuovo}>
                    <i className="bi-plus-lg"></i> Nuovo
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <div className="">
                <div className="table-responsive">
                  <table className={`table ${styles.projectListTable} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
                    <thead>
                      <tr>
                        <th scope="col" className={`${styles.w15} ps-4`}>
                          Nome
                        </th>
                        <th className={`${styles.w15}`} scope="col">
                          Cognome
                        </th>
                        {tipologiaServizio && (
                          <th className={`${styles.w15}`} scope="col">
                            Servizi
                          </th>
                        )}
                        <th className={`${styles.w15}`} scope="col">
                          Data di Nascita
                        </th>
                        <th className={`${styles.w15}`} scope="col">
                          Sesso
                        </th>
                        <th className={`${styles.w15}`} scope="col">
                          Codice Fiscale
                        </th>
                        <th className={`${styles.w10}`} scope="col">
                          Gestione
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersPagina?.map((user) => (
                        <tr key={user.id}>
                          <td className="ps-4">{user.nome}</td>
                          <td>{user.cognome}</td>
                          {tipologiaServizio && <td>{user.tipologiaVisite?.[0]?.descrizione ?? "N/A"}</td>}
                          <td>
                            {new Date(user.dataNascita).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                          <td>{SESSO_LABELS[user.sesso]}</td>
                          <td>{user.codiceFiscale ?? "N/A"}</td>
                          <td>
                            <ul className="list-inline m-0">
                              {onModificaInLista && (
                                <li className="list-inline-item">
                                  <button className="btn px-2 text-primary" title="Modifica" onClick={() => onModificaInLista(user)}>
                                    <i className="bi bi-pencil font-size-18"></i>
                                  </button>
                                </li>
                              )}
                              <li className="list-inline-item">
                                <button className="btn px-2 text-success" title="Prenotazioni attive" onClick={() => onVisualizzaPrenotazione(user)}>
                                  <i className="bi-calendar-check"></i>
                                </button>
                              </li>
                              <li className="list-inline-item position-relative">
                                <button className={`btn px-2 text-danger`} title="Cancella" onClick={() => onCancella(user.id.toString())}>
                                  <i className="bi bi-trash font-size-18"></i>
                                </button>
                              </li>
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 row g-0 align-items-center pb-4">
            <div className="col-sm-6">
              <div>
                <p className="mb-sm-0">
                  Mostrando {totaleUsers === 0 ? 0 : inizioPaginaUtenti + 1} a {Math.min(inizioPaginaUtenti + USERS_PER_PAGINA, totaleUsers)} di {totaleUsers} totali
                </p>
              </div>
            </div>
            <div className="col-sm-6 me-0">
              <div className="float-sm-end">
                <ul className="pagination mb-sm-0">
                  <li className={`page-item ${indicePagina <= 1 ? "disabled" : ""}`}>
                    <button className="btn page-link" onClick={() => onCambiaPagina(indicePagina - 1)} disabled={indicePagina <= 1}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li className="page-item">
                    <div className="btn-toolbar" role="toolbar">
                      <div className="btn-group">
                        {Array.from({ length: totalePagineUtenti }, (_, indice) => (
                          <button key={indice} className={`btn btn-primary ${indicePagina === indice + 1 ? "active" : ""}`} onClick={() => onCambiaPagina(indice + 1)}>
                            {indice + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                  <li className={`page-item ${indicePagina >= totalePagineUtenti ? "disabled" : ""}`}>
                    <button className="btn page-link" onClick={() => onCambiaPagina(indicePagina + 1)} disabled={indicePagina >= totalePagineUtenti}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function VisualizzaAnagrafica({ utente, mostraServizi, clickModificaInAnagrafica }: Readonly<{ utente: User | null; mostraServizi: boolean; clickModificaInAnagrafica: (utente: User) => void }>) {
  return (
    <div className="card-body">
      <table className="table">
        <tbody>
          <tr>
            <th scope="row">Nome</th>
            <td>{utente?.nome}</td>
          </tr>
          <tr>
            <th scope="row">Cognome</th>
            <td>{utente?.cognome}</td>
          </tr>
          {mostraServizi && (
            <tr>
              <th scope="row">Servizi</th>
              <td>{utente?.tipologiaVisite?.[0]?.descrizione}</td>
            </tr>
          )}
          <tr>
            <th scope="row">Codice Fiscale</th>
            <td>{utente?.codiceFiscale ?? "/"}</td>
          </tr>
          <tr>
            <th scope="row">Data di Nascita</th>
            <td>{new Date(utente?.dataNascita ?? "").toLocaleDateString("it-IT")}</td>
          </tr>
          <tr>
            <th scope="row">Sesso</th>
            <td>{SESSO_LABELS[utente?.sesso ?? 2]} </td>
          </tr>
        </tbody>
      </table>
      <button type="button" className="btn btn-primary" onClick={() => utente && clickModificaInAnagrafica(utente)}>
        Modifica
      </button>
    </div>
  );
}
function ModificaAnagrafica({
  submitAnagrafica,
  form,
  setForm,
  mostraServizi,
  serviziModificabili,
  tipologiaVisite,
  clickAnnulla,
}: Readonly<{
  submitAnagrafica: (contenutoForm: React.SubmitEvent<HTMLFormElement>) => void;
  form: DatiForm;
  setForm: React.Dispatch<React.SetStateAction<DatiForm>>;
  mostraServizi: boolean;
  serviziModificabili: boolean;
  tipologiaVisite: TipologiaVisita[] | null;
  clickAnnulla: () => void;
}>) {
  return (
    <div className="form-floating card-body">
      <form onSubmit={submitAnagrafica}>
        <table className="table">
          <tbody>
            <tr>
              <th scope="row">Nome</th>
              <td>
                <input type="text" id="Nome" className="form-control" value={form?.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </td>
            </tr>
            <tr>
              <th scope="row">Cognome</th>
              <td>
                <input type="text" id="Cognome" className="form-control" value={form?.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} required />
              </td>
            </tr>
            {mostraServizi && (
              <tr>
                <th scope="row">Servizi</th>
                <td>
                  <select
                    id="Servizi"
                    className="form-select"
                    value={form?.tipologiaVisite?.[0]?.id ?? ""}
                    disabled={!serviziModificabili}
                    onChange={(e) => {
                      const servizio = tipologiaVisite?.find((t) => t.id === Number(e.target.value));
                      setForm({ ...form, tipologiaVisite: servizio ? [servizio] : [] });
                    }}
                  >
                    <option value=""></option>
                    {tipologiaVisite?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.descrizione}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )}
            <tr>
              <th scope="row">Codice Fiscale</th>
              <td>
                <input type="text" id="CodiceFiscale" className="form-control" value={form?.codiceFiscale ?? "/"} onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value })} />
              </td>
            </tr>
            <tr>
              <th scope="row">Data di Nascita</th>
              <td>
                <input type="date" id="DataNascita" className="form-control" value={form?.dataNascita?.split("T")[0]} onChange={(e) => setForm({ ...form, dataNascita: e.target.value })} required />
              </td>
            </tr>
            <tr>
              <th scope="row">Sesso</th>
              <td>
                <select id="Sesso" className="form-select" value={form?.sesso} onChange={(e) => setForm({ ...form, sesso: Number(e.target.value) })} required>
                  <option value="0">Maschio</option>
                  <option value="1">Femmina</option>
                  <option value="2">Non specificato</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <button type="submit" className="btn btn-success me-5">
          Modifica
        </button>
        <button type="button" className="btn btn-danger" onClick={clickAnnulla}>
          Annulla
        </button>
      </form>
    </div>
  );
}
function Prenotazioni({
  onAggiungiFascia,
  giorniSettimana,
  grigliaOre,
  isGiornoDisponibile,
  onClickCasella,
  onCaricaDisponibilitaPerTipologia,
  onCaricaDisponibilitaPerMedico,
  onCaricaMediciPerTipologia,
  mediciTipologia,
  tipologiaVisite,
  onPrenota,
  onDisdici,
  onDisdiciById,
  onCaricaAppuntamentoPerTipologia,
  onCaricaAppuntamentoPerMedico,
  appuntamenti,
  statoCellaPaziente,
  statoCellaMedico,
  utenteSelezionato,
  tipoLista,
  sezionePrenotazioni,
  setSezionePrenotazioni,
  onMostraPrenotazioni,
}: Readonly<{
  onAggiungiFascia: (giorno: number, oraInizio: number, oraFine: number) => void;
  giorniSettimana: Date[];
  grigliaOre: number[];
  isGiornoDisponibile: (giorno: Date, ora: number) => boolean;
  onClickCasella: (giorno: Date, ora: number) => void;
  onCaricaDisponibilitaPerTipologia: (id: string) => Promise<void>;
  onCaricaDisponibilitaPerMedico: (id: string) => Promise<void>;
  onCaricaMediciPerTipologia: (id: string) => Promise<void>;
  mediciTipologia: DisponibilitaMedico[] | null;
  tipologiaVisite: TipologiaVisita[] | null;
  onPrenota: (giorno: Date, ora: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null) => void;
  onDisdici: (giorno: Date, ora: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null) => void;
  onDisdiciById: (tipologiaSelezionataId: string) => void;
  onCaricaAppuntamentoPerTipologia: (id: string) => Promise<void>;
  onCaricaAppuntamentoPerMedico: (id: string) => Promise<void>;
  appuntamenti: Appuntamento[] | null;
  statoCellaPaziente: (giorno: Date, ora: number) => string;
  statoCellaMedico: (giorno: Date, ora: number) => string;
  utenteSelezionato: User | null;
  tipoLista: string;
  sezionePrenotazioni: string;
  setSezionePrenotazioni: React.Dispatch<React.SetStateAction<"nuovaPrenotazione" | "visualizzaPrenotazioni">>;
  onMostraPrenotazioni: (id: string) => void;
}>) {
  const [mostraFormFasciaDisponibilita, setMostraFormFasciaDisponibilita] = useState(false);
  const [giornoGestioneDisponibilita, setGiornoGestioneDisponibilita] = useState(1);
  const [oraInizioGestioneDisponibilita, setOraInizioGestioneDisponibilita] = useState(8);
  const [oraFineGestioneDisponibilita, setOraFineGestioneDisponibilita] = useState(19);
  const [tipologiaSelezionataId, setTipologiaSelezionataId] = useState("");
  const [medicoSelezionatoId, setMedicoSelezionatoId] = useState("");
  const { utente, isPaziente, isMedico, isAdmin } = useUtente();

  const titoloCalendario = tipoLista === "Medici" ? `del Dr. ${utenteSelezionato?.nome} ${utenteSelezionato?.cognome}` : `di ${utenteSelezionato?.nome} ${utenteSelezionato?.cognome}`;

  const COLORI_PAZIENTE: Record<string, string> = { mio: "bg-success", prenotabile: "bg-info", pieno: "bg-light" };
  const COLORI_MEDICO: Record<string, string> = { prenotato: "bg-danger", prenotabile: "bg-success", na: "bg-light" };
  const COLORI_ADMIN_PAZIENTE: Record<string, string> = { mio: "bg-danger", pieno: "bg-light" };

  function formattaData(dataIso: string) {
    const d = new Date(dataIso);
    return {
      giorno: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }),
      ora: d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  function gestioneCelle(giorno: Date, ora: number) {
    let controlloCella: string;
    let mappaColori: Record<string, string>;
    if (isPaziente) {
      controlloCella = statoCellaPaziente(giorno, ora);
      mappaColori = COLORI_PAZIENTE;
    } else if (isAdmin && tipoLista === "Pazienti") {
      controlloCella = statoCellaPaziente(giorno, ora);
      mappaColori = COLORI_ADMIN_PAZIENTE;
    } else {
      // isMedico, oppure isAdmin sui Medici
      controlloCella = statoCellaMedico(giorno, ora);
      mappaColori = COLORI_MEDICO;
    }

    return { controlloCella, coloreCella: mappaColori[controlloCella] };
  }

  function datiAzioneCella(giorno: Date, ora: number, giornoDisponibile: boolean, controlloCella: string) {
    if (isPaziente) {
      if (giornoDisponibile && controlloCella === "prenotabile") return { titolo: "Clicca per prenotare", azione: () => onPrenota(giorno, ora, tipologiaSelezionataId, medicoSelezionatoId) };
      if (giornoDisponibile && controlloCella === "mio") return { titolo: "Clicca per disdire", azione: () => onDisdici(giorno, ora, tipologiaSelezionataId, medicoSelezionatoId) };
    } else {
      if (controlloCella === "prenotabile" || controlloCella === "na") return { titolo: "Clicca per rendere disponibile", azione: () => onClickCasella(giorno, ora) };
      if (controlloCella === "prenotato") return { titolo: "Clicca per disdire", azione: () => onDisdici(giorno, ora, tipologiaSelezionataId) };
    }
    return { titolo: "", azione: undefined }; // nessuna azione possibile
  }

  const mediciUnici = [...new Map(mediciTipologia?.map((d) => [d.medicoId, d])).values()];

  return (
    <div className={styles.prenotazioniContainer}>
      <div className="row">
        {sezionePrenotazioni === "nuovaPrenotazione" && (
          <div className={`p-3  ${stylesShared.cardBorder}`}>
            <div className={`card ${styles.projectListTableColor}`}>
              <div className={`card-header text-white ${styles.titleMedisport}`}>
                <div className="row">
                  <div className="col-6">
                    {isAdmin && <h5 className="m-2">Calendario {titoloCalendario}</h5>}
                    {!isAdmin && <h5 className="m-2">Calendario prenotazioni</h5>}
                  </div>
                  <div className="col-6 d-flex justify-content-end">
                    {!isPaziente && (
                      <button className="btn btn-success me-3" onClick={() => setMostraFormFasciaDisponibilita((v) => !v)}>
                        <i className="bi-plus-lg"></i> Fascia oraria
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={() => onMostraPrenotazioni(isAdmin ? (utenteSelezionato?.id.toString() ?? "") : (utente?.id ?? ""))}>
                      Indietro <i className="bi-box-arrow-left"></i>
                    </button>
                    {mostraFormFasciaDisponibilita && (
                      <div className={`${styles.pannelloDisponibilita} me-4`}>
                        <div className={`d-flex gap-3 align-items-end p-3 ${stylesShared.cardBorder}`}>
                          <div>
                            <label htmlFor="selGiorno" className="form-label text-muted">
                              Giorno
                            </label>
                            <select id="selGiorno" className="form-select" value={giornoGestioneDisponibilita} onChange={(e) => setGiornoGestioneDisponibilita(Number(e.target.value))}>
                              {GIORNI_SETTIMANA.map((giorno) => (
                                <option key={giorno.indice} value={giorno.indice}>
                                  {giorno.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="selOraInizio" className="form-label text-muted">
                              Dalle
                            </label>
                            <select id="selOraInizio" className="form-select" value={oraInizioGestioneDisponibilita} onChange={(e) => setOraInizioGestioneDisponibilita(Number(e.target.value))}>
                              {grigliaOre.map((ora) => (
                                <option key={ora} value={ora}>
                                  {ora.toString().padStart(2, "0")}:00
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="selOraFine" className="form-label text-muted">
                              Alle
                            </label>
                            <select id="selOraFine" className="form-select" value={oraFineGestioneDisponibilita} onChange={(e) => setOraFineGestioneDisponibilita(Number(e.target.value))}>
                              {grigliaOre.map((ora) => (
                                <option key={ora} value={ora}>
                                  {ora.toString().padStart(2, "0")}:00
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => {
                              onAggiungiFascia(giornoGestioneDisponibilita, oraInizioGestioneDisponibilita, oraFineGestioneDisponibilita);
                              setMostraFormFasciaDisponibilita(false);
                            }}
                          >
                            <i className="bi-check-lg"></i> Conferma
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-12">
                  <div className="table-responsive">
                    {!isPaziente && (
                      <div className="d-flex align-items-center gap-4 px-3 py-2">
                        <span className="text-muted">Clicca su una casella per aggiungere o rimuovere la disponibilità</span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-light`}></span>
                          <span> Libera</span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-success`}></span>
                          <span>Disponibile </span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-danger`}></span>
                          <span> Visita confermata</span>
                        </span>
                      </div>
                    )}
                    {isPaziente && (
                      <div className="d-flex align-items-center gap-4 px-3 py-2">
                        <span className="text-muted">Clicca su una casella per confermare/disdire la prenotazione:</span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-info`}></span>
                          <span> Disponibile</span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-success`}></span>
                          <span>Visita confermata </span>
                        </span>
                      </div>
                    )}
                    <table className={`table ${styles.tableSpace} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
                      <thead>
                        <tr>
                          <th></th>
                          {giorniSettimana.map((giorno) => (
                            <th key={giorno.toISOString()} scope="col" className={`ps-4`}>
                              {giorno.toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                weekday: "short",
                              })}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grigliaOre.map((ora) => (
                          <tr key={ora}>
                            <th scope="row">{ora.toString().padStart(2, "0")}:00</th>
                            {giorniSettimana.map((giorno) => {
                              const giornoDisponibile = isGiornoDisponibile(giorno, ora);
                              const { coloreCella, controlloCella } = gestioneCelle(giorno, ora);
                              const { titolo, azione } = datiAzioneCella(giorno, ora, giornoDisponibile, controlloCella);
                              return <td title={titolo} key={giorno.toISOString()} className={`${styles.cellStyle} ${coloreCella} ${azione ? styles.cellStylePointer : ""}`} onClick={azione}></td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {sezionePrenotazioni === "visualizzaPrenotazioni" && (
          <div className="container">
            <div className="row">
              <div className="col-8">
                <div className={`p-3 ${stylesShared.cardBorder}`}>
                  <div className={`card ${styles.projectListTableColor}`}>
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      <div className="row">
                        <div className="col-6">
                          {isAdmin && <h5 className="m-2">Prenotazioni confermate {titoloCalendario}</h5>}
                          {!isAdmin && <h5 className="m-2">Prenotazioni confermate</h5>}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="table-responsive">
                          <table className={`table ${styles.projectListTable} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
                            <thead>
                              <tr>
                                <th scope="col" className={`${styles.w20} ps-4`}>
                                  Tipologia Visita
                                </th>
                                {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && (
                                  <th className={`${styles.w20}`} scope="col">
                                    Medico
                                  </th>
                                )}
                                {(isMedico || (isAdmin && tipoLista === "Medici")) && (
                                  <th className={`${styles.w20}`} scope="col">
                                    Paziente
                                  </th>
                                )}
                                <th className={`${styles.w20}`} scope="col">
                                  Giorno
                                </th>
                                <th className={`${styles.w20}`} scope="col">
                                  Ora
                                </th>
                                <th className={`${styles.w10}`} scope="col">
                                  Gestione
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {appuntamenti
                                ?.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                                .map((appuntamento) => {
                                  const { giorno, ora } = formattaData(appuntamento.data);
                                  return (
                                    <tr key={appuntamento.id}>
                                      <td className="ps-4">{appuntamento.tipologiaVisita}</td>
                                      {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && <td>{`${appuntamento.medicoNome} ${appuntamento.medicoCognome}`}</td>}
                                      {(isMedico || (isAdmin && tipoLista === "Medici")) && <td>{`${appuntamento.pazienteNome} ${appuntamento.pazienteCognome}`}</td>}
                                      <td>{giorno}</td>
                                      <td>{ora}</td>
                                      <td>
                                        <ul className="list-inline m-0">
                                          <li className="list-inline-item position-relative">
                                            <button className={`btn px-2 text-danger`} title="Cancella" onClick={() => onDisdiciById(appuntamento.id.toString())}>
                                              <i className="bi bi-trash font-size-18"></i>
                                            </button>
                                          </li>
                                        </ul>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-4">
                <div className={`p-3 ${stylesShared.cardBorder}`}>
                  <div className="card">
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && <h5 className="m-2">Prenota nuova visita</h5>}
                      {(isMedico || (isAdmin && tipoLista === "Medici")) && <h5 className="m-2">Gestisci disponibilità</h5>}
                    </div>
                    {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && (
                      <div className="container">
                        <div className="row p-3">
                          <label htmlFor="selGiorno" className="form-label text-muted">
                            Seleziona la tipologia di servizio
                          </label>
                          <select
                            id="selTipologia"
                            className="form-select"
                            value={tipologiaSelezionataId}
                            onChange={async (e) => {
                              const id = e.target.value;
                              await onCaricaMediciPerTipologia(id);
                              setTipologiaSelezionataId(id);
                            }}
                          >
                            <option value="" disabled hidden>
                              Servizi
                            </option>
                            {tipologiaVisite?.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.descrizione}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="row p-3">
                          <label htmlFor="selGiorno" className="form-label text-muted">
                            Preferisci un professionista?
                          </label>
                          <select
                            disabled={!mediciTipologia || mediciTipologia.length === 0}
                            id="selOperatore"
                            className="form-select"
                            value={medicoSelezionatoId}
                            onChange={(e) => {
                              setMedicoSelezionatoId(e.target.value);
                            }}
                          >
                            <option value="">Tutti gli operatori</option>
                            {mediciUnici.map((m) => (
                              <option key={m.medicoId} value={m.medicoId}>
                                {m.medicoNome} {m.medicoCognome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="row p-3">
                          {mediciUnici?.length === 0 && (
                            <label htmlFor="selGiorno" className="form-label text-muted">
                              {" "}
                              Nessun medico disponibile
                            </label>
                          )}
                          <button
                            disabled={tipologiaSelezionataId === "" || !mediciTipologia || mediciTipologia.length === 0}
                            className="btn btn-success rounded-pill px-4 fw-bold"
                            onClick={async () => {
                              if (medicoSelezionatoId === "") {
                                await Promise.all([onCaricaDisponibilitaPerTipologia(tipologiaSelezionataId), onCaricaAppuntamentoPerTipologia(tipologiaSelezionataId)]);
                              } else {
                                await Promise.all([onCaricaDisponibilitaPerMedico(medicoSelezionatoId), onCaricaAppuntamentoPerMedico(medicoSelezionatoId)]);
                              }
                              setSezionePrenotazioni("nuovaPrenotazione");
                            }}
                          >
                            PRENOTA
                          </button>
                        </div>
                      </div>
                    )}
                    {(isMedico || (isAdmin && tipoLista === "Medici")) && (
                      <div className="row p-3">
                        <label htmlFor="selGiorno" className="form-label text-muted">
                          Aggiungi/rimuovi i giorni e le ore di disponibilità
                        </label>
                        <button className="btn btn-success rounded-pill px-4 fw-bold" onClick={() => setSezionePrenotazioni("nuovaPrenotazione")}>
                          CONTINUA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AreaPersonale;
