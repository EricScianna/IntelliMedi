import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AreaPersonale.module.css";
import stylesShared from "../shared.module.css";
import logo from "../assets/logo2.png";
import type { DatiForm, TipologiaVisita, User, DisponibilitaMedico } from "../types";
import { API_URL, SESSO_LABELS, FORM_VUOTO } from "../constants";
import { useErrore } from "../hooks/useErrore";
import FormDatiUtente from "../components/FormDatiUtente";
import Avvisi from "../components/Avvisi";

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

function AreaPersonale() {
  // Stati per la gestione dei dati users
  const [form, setForm] = useState<DatiForm>(FORM_VUOTO);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [tipologiaVisite, setTipologiaVisite] = useState<TipologiaVisita[] | null>(null);
  // Stati per la gestione degli errori
  const { errore, setErrore } = useErrore();
  // Stati per la gestione della visualizzazione sezioni
  const navigate = useNavigate();
  const [sezioneContent, setSezioneContent] = useState<"contentCards" | "anagrafica" | "prenotazioni" | "recensioni" | "listaUtenti" | "creaMedico">("contentCards");
  const [sezioneAnagrafica, setSezioneAnagrafica] = useState<"visualizza" | "modifica">("visualizza");
  const [tipoLista, setTipoLista] = useState("");
  const [sidebarChiusa, setSidebarChiusa] = useState(false);
  // Stati per la gestione della lista users
  const USERS_PER_PAGINA = 10;
  const [indicePagina, setIndicePagina] = useState(1);
  const totaleUsers = users?.length ?? 0;
  const totalePagineUtenti = Math.ceil(totaleUsers / USERS_PER_PAGINA);
  const inizioPaginaUtenti = (indicePagina - 1) * USERS_PER_PAGINA;
  const usersPagina = users?.slice(inizioPaginaUtenti, inizioPaginaUtenti + USERS_PER_PAGINA);
  // Stati per la gestione delle prenotazioni
  const [lunediCorrente, setLunediCorrente] = useState<Date>(() => {
    const oggi = new Date();
    const g = oggi.getDay();
    const offset = g === 0 ? 6 : g - 1;
    oggi.setDate(oggi.getDate() - offset);
    return oggi;
  });

  const [disponibilitaMedico, setDisponibilitaMedico] = useState<DisponibilitaMedico[] | null>(null);
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

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

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
      { etichetta: "Prenotazioni", descrizione: "Visualizza e gestisci le prenotazioni", immagine: "bi-calendar-check", link: mostraPrenotazioni },
      { etichetta: "Recensioni", descrizione: "Modera le recensioni", immagine: "bi-star-fill", link: mostraRecensioni },
    ],
    Paziente: [
      { etichetta: "Anagrafica", descrizione: "Visualizza e modifica i tuoi dati personali", immagine: "bi-person", link: mostraAnagrafica },
      { etichetta: "Prenotazioni", descrizione: "Gestisci le tue prenotazioni", immagine: "bi-calendar", link: mostraPrenotazioni },
      { etichetta: "Recensisci", descrizione: "Recensisci i servizi ricevuti", immagine: "bi-star-fill", link: mostraRecensioni },
    ],
    Medico: [
      { etichetta: "Anagrafica", descrizione: "Visualizza e modifica i tuoi dati personali", immagine: "bi-person", link: mostraAnagrafica },
      { etichetta: "Prenotazioni", descrizione: "Gestisci le tue prenotazioni", immagine: "bi-calendar", link: mostraPrenotazioni },
      { etichetta: "Recensioni", descrizione: "Visualizza recensioni ricevute", immagine: "bi-star-fill", link: mostraRecensioni },
    ],
  };

  const ruolo = localStorage.getItem("ruolo") ?? "";
  const vociSidebar = vociPerRuolo[ruolo] ?? [];
  const colClass = vociSidebar.length > 3 ? "col-5 g-5" : "col-3";
  const nomeVisualizzato = ruolo === "Amministratore" ? "Amministratore" : `${user?.nome} ${user?.cognome}`;

  function createHeaders(hasContentType: boolean) {
    const headers: Record<string, string> = {
      Authorization: "Bearer " + localStorage.getItem("token"),
    };

    if (hasContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

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

  async function getGenerico(percorso: string) {
    const risposta = await fetch(`${API_URL}/api/${percorso}`, {
      method: "GET",
      headers: createHeaders(false),
    });

    if (!risposta.ok) {
      setErrore("Dati non validi");
      return;
    }
    return risposta.json();
  }

  async function postGenerico() {
    const risposta = await fetch(`${API_URL}/api/${tipoLista}`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({ ...form, username, password }),
    });

    if (risposta.ok) return true;
    setErrore("Utente già esistente o dati non validi");
    return false;
  }

  async function postDisponibilita(giorno: Date, ora: number) {
    const medicoId = Number(localStorage.getItem("id"));
    // template literal = modo di scrivere stringhe usando i backtick ` (alt+096) invece degli apici ' o ".
    // dentro posso infilare espressioni con ${...}
    const oraInizio = `${ora.toString().padStart(2, "0")}:00:00`;
    const oraFine = `${(ora + 1).toString().padStart(2, "0")}:00:00`;
    const risposta = await fetch(`${API_URL}/api/DisponibilitaMedico`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({ medicoId, giorno: giorno.getDay(), oraInizio, oraFine }),
    });

    if (risposta.ok) return true;
    setErrore("Errore");
    return false;
  }

  async function putGenerico(percorso: string) {
    const risposta = await fetch(`${API_URL}/api/${percorso}`, {
      method: "PUT",
      headers: createHeaders(true),
      body: JSON.stringify(form),
    });

    if (!risposta.ok) setErrore("Errore nella modifica");
  }

  async function deleteGenerico(id: string) {
    const risposta = await fetch(`${API_URL}/api/${tipoLista}/${id}`, {
      method: "DELETE",
      headers: createHeaders(false),
    });

    if (!risposta.ok) setErrore("Errore nella cancellazione");
  }

  async function mostraAnagrafica() {
    const dati = await getGenerico(`${rottaPerRuolo[ruolo]}/${localStorage.getItem("id")}`);
    setUser(dati);
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
    const dati = await getGenerico("TipologiaVisita");
    setTipologiaVisite(dati);
    return dati;
  }

  async function creaMedico(e: React.SubmitEvent) {
    e.preventDefault();
    const isSuccess = await postGenerico();
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
    await deleteGenerico(id);
    mostraListaUtenti(tipoLista);
  }

  async function caricaDisponibilita() {
    const dati = await getGenerico(`DisponibilitaMedico/GetAllDays?medicoId=${localStorage.getItem("id")}`);
    setDisponibilitaMedico(dati);
  }

  async function mostraPrenotazioni() {
    caricaDisponibilita();
    setSezioneContent("prenotazioni");
    setTipoLista("DisponibilitaMedico");
  }

  async function creaCasella(giorno: Date, ora: number) {
    const verde = oreDisponibiliDelGiorno(giorno.getDay()).includes(ora);
    if (verde) {
      deleteGenerico();
    } else {
      //caricaDisponibilita solo se andato a buon fine
      const ok = await postDisponibilita(giorno, ora);
      if (ok) await caricaDisponibilita();
    }
  }

  async function mostraRecensioni() {}

  function eseguiLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("ruolo");
    localStorage.removeItem("nome");
    localStorage.removeItem("cognome");
    localStorage.removeItem("id");
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
                giorniSettimana={giorniSettimana}
                grigliaOre={grigliaOre}
                isVerde={(giorno, ora) => oreDisponibiliDelGiorno(giorno.getDay()).includes(ora)}
                onClickCasella={creaCasella}
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
}: Readonly<{
  tipoLista: string;
  totaleUsers: number;
  onNuovo?: () => void;
  tipologiaServizio?: boolean;
  usersPagina: User[] | undefined;
  onModificaInLista?: (utente: User) => void;
  onCancella: (idUtente: string) => void;
  inizioPaginaUtenti: number;
  USERS_PER_PAGINA: number;
  indicePagina: number;
  onCambiaPagina: (numeroPagina: number) => void;
  totalePagineUtenti: number;
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
                          <td>{user.sesso ?? SESSO_LABELS[user.sesso]}</td>
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
                                <button className="btn px-2 text-success" title="Prenotazioni attive">
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
  giorniSettimana,
  grigliaOre,
  isVerde,
  onClickCasella,
}: Readonly<{ giorniSettimana: Date[]; grigliaOre: number[]; isVerde: (giorno: Date, ora: number) => boolean; onClickCasella: (giorno: Date, ora: number) => void }>) {
  return (
    <div className="row g-0">
      <div className={`p-3  ${stylesShared.cardBorder}`}>
        <div className={`card ${styles.projectListTableColor}`}>
          <div className={`card-header text-white ${styles.titleMedisport}`}>
            <div className="row">
              <div className="col-6">
                <h5 className="m-2">Calendario prenotazioni</h5>
              </div>
              <div className="col-6 d-flex justify-content-end">
                <button className="btn btn-success">
                  <i className="bi-plus-lg"></i> Aggiungi disponibilità
                </button>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <div className="">
                <div className="table-responsive">
                  <div className="d-flex align-items-center gap-4 px-3 py-2">
                    <span className="text-muted">Clicca su una casella per aggiungere o rimuovere la tua disponibilità.</span>

                    <span className="d-flex align-items-center gap-2">
                      <span className="d-inline-block rounded bg-light" style={{ width: 16, height: 16 }}></span>
                      Libera
                    </span>

                    <span className="d-flex align-items-center gap-2">
                      <span className="d-inline-block rounded bg-success" style={{ width: 16, height: 16 }}></span>
                      Disponibile
                    </span>

                    <span className="d-flex align-items-center gap-2">
                      <span className="d-inline-block rounded border bg-danger" style={{ width: 16, height: 16 }}></span>
                      Visita confermata
                    </span>
                  </div>
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
                            const verde = isVerde(giorno, ora);
                            // onClick invia al padre onClickCasella con i valori (giorno, ora)
                            return (
                              <td
                                title={verde ? "Clicca per rimuovere" : "Clicca per rendere disponibile"}
                                key={giorno.toISOString()}
                                className={`${styles.cellStyle} ${verde ? "bg-success" : "bg-light"}`}
                                onClick={() => onClickCasella(giorno, ora)}
                              ></td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* </div>
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
            </div>*/}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AreaPersonale;
