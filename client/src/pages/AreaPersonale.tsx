import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/areaRiservata.module.css";
import stylesShared from "../shared.module.css";
import type { DatiForm, TipologiaVisita, User, VoceMenu } from "../types";
import { FORM_VUOTO } from "../constants";
import { useErrore } from "../hooks/useErrore";
import { usePrenotazioni } from "../hooks/usePrenotazioni";
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
import { get, post, put, del } from "../api";

const rottaPerRuolo: Record<string, string> = { Paziente: "Pazienti", Medico: "Medici" };

interface Colonna {
  etichetta: string;
  onNuovo?: () => void;
  tipologiaServizio?: boolean;
  onModificaInLista?: (utente: User) => void;
}

//COMPONENTE: AreaPersonale (PascalCase obbligatorio): funzione principale di una pagina React.
//tranne useState, tutto quello che c'è all'interno viene ricreato ad ogni render
//Ogni setState prenota un render, il valore si aggiorna solo al render successivo
function AreaPersonale() {
  //#region Stati
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
  const [sezioneContent, setSezioneContent] = useState<"contentCards" | "anagrafica" | "prenotazioni" | "listaUtenti" | "postMedico">("contentCards");
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
  const [pazienteSelezionatoId, setPazienteSelezionatoId] = useState("");
  const [isNuovaPrenotazioneAdmin, setNuovaPrenotazioneAdmin] = useState<boolean>(false);
  //#endregion

  const colonnePerTipo: Record<string, Colonna> = {
    Medici: {
      etichetta: "Medici",
      onNuovo: () => {
        caricaListaTipologiaVisita();
        cambiaModalita("postMedico");
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

  const vociSidebar = vociPerRuolo[ruolo] ?? [];
  const nomeVisualizzato = ruolo === "Amministratore" ? "Amministratore" : `${user?.nome} ${user?.cognome}`;

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

  const getGenerico = useCallback(
    async (percorso: string) => {
      try {
        return await get(percorso);
      } catch {
        setErrore("Dati non validi");
        return false;
      }
    },
    [setErrore],
  );

  function calcolaIdUtente() {
    if (isNuovaPrenotazioneAdmin) return pazienteSelezionatoId;
    if (ruolo === "Amministratore") return utenteSelezionato?.id.toString();
    return utente?.id;
  }
  const idUtente = calcolaIdUtente();

  const {
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
  } = usePrenotazioni({ getGenerico, idUtente, setErrore, isPaziente, isAdmin, tipoLista, isNuovaPrenotazioneAdmin, deleteGenerico });

  async function postMedico(e: React.SubmitEvent) {
    e.preventDefault();
    try {
      await post(tipoLista, { ...form, username, password });
      mostraListaUtenti(tipoLista);
    } catch {
      setErrore("Utente già esistente o dati non validi");
    }
  }

  async function putGenerico(percorso: string) {
    try {
      await put(percorso, form);
      return true;
    } catch {
      setErrore("Errore nella modifica");
      return false;
    }
  }

  async function deleteGenerico(id: string) {
    try {
      await del(id);
      return true;
    } catch {
      setErrore("Errore nell'eliminazione");
      return false;
    }
  }

  //useCallback: il componente mantiene la funzione tra un render e l'altro, ne crea una nuova solo se cambia una delle dipendenze ([])
  const caricaUser = useCallback(async () => {
    const dati = await getGenerico(`${rottaPerRuolo[ruolo]}/${utente?.id}`);
    setUser(dati);
  }, [ruolo, utente?.id, getGenerico]);

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

  function cambiaModalita(sezione: "listaUtenti" | "postMedico") {
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
    await caricaUser();
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
      <div className="d-flex flex-column flex-lg-row flex-grow-1">
        {/* Sidebar */}
        <Sidebar sidebarChiusa={sidebarChiusa} clickToggleSidebar={toggleSidebar} vociSidebar={vociSidebar}></Sidebar>
        {/* Content Area */}
        <div className={`flex-grow-1 m-4 ${styles.contentArea}`}>
          <div className="m-4">
            {sezioneContent === "contentCards" && (
              /* Cards */
              <Cards vociSidebar={vociSidebar}></Cards>
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
            {sezioneContent === "postMedico" && (
              <div className={` col-lg-6 mb-5 mb-lg-0 p-3 ${stylesShared.cardBorder}`}>
                <div className=" card bg-body-tertiary">
                  <FormDatiUtente
                    titolo="Registra nuovo medico"
                    submitUtente={(contenutoForm) => postMedico(contenutoForm)}
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
                <div className={`col-12 col-lg-6 p-3 ${stylesShared.cardBorder}`}>
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
                isGiornoDisponibile={(giorno, ora) => oreDisponibiliDelGiorno(giorno).includes(ora)}
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
export default AreaPersonale;
