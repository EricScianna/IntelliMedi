import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AreaPersonale.module.css";
import logo from "../assets/logo2.png";

const API_URL = "https://localhost:7223";

interface User {
  id: number;
  nome: string;
  cognome: string;
  tipologiaVisite?: TipologiaVisita[];
  dataNascita: string;
  sesso: number;
  codiceFiscale?: string;
  username?: string;
  password?: string;
}

interface TipologiaVisita {
  id: number;
  descrizione: string;
}

interface VoceMenu {
  etichetta: string;
  descrizione: string;
  immagine: string;
  link: () => void;
}

interface Colonna {
  etichetta: string;
  buttonNew?: boolean;
  tipologiaServizio?: boolean;
  tastoModifica?: boolean;
}

const rottaPerRuolo: Record<string, string> = { Paziente: "Pazienti", Medico: "Medici" };

function AreaPersonale() {
  // Stati per la gestione dei dati users
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [servizi, setServizi] = useState<TipologiaVisita[]>([]);
  const [dataNascita, setDataNascita] = useState("");
  const [sesso, setSesso] = useState(0);
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [tipologiaVisite, setTipologiaVisite] = useState<TipologiaVisita[] | null>(null);
  // Stati per la gestione degli errori e successi
  const [errore, setErrore] = useState("");
  // Stati per la gestione della visualizzazione sezioni
  const navigate = useNavigate();
  const [sezioneContent, setsezioneContent] = useState<"cards" | "anagrafica" | "prenotazioni" | "recensioni" | "listaUtenti" | "creaMedico">("cards");
  const [sezioneAnagrafica, setSezioneAnagrafica] = useState<"visualizza" | "modifica">("visualizza");
  const [tipoLista, setTipoLista] = useState("");
  const [sidebarChiusa, setSidebarChiusa] = useState(false);
  // Stati per la gestione della lista users
  const PER_PAGINA = 10;
  const [pagina, setPagina] = useState(1);
  const totaleUsers = users?.length ?? 0;
  const totalePagine = Math.ceil(totaleUsers / PER_PAGINA);
  const inizio = (pagina - 1) * PER_PAGINA;
  const usersPagina = users?.slice(inizio, inizio + PER_PAGINA);

  const [form, setForm] = useState<Omit<User, "id" | "username" | "password">>({
    nome: "",
    cognome: "",
    tipologiaVisite: [],
    dataNascita: "",
    sesso: 0,
    codiceFiscale: "",
  });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (errore != "") {
      setTimeout(() => setErrore(""), 3000);
    }
  }, [errore]);

  const colonnePerTipo: Record<string, Colonna[]> = {
    Medici: [{ etichetta: "Medici", buttonNew: true, tipologiaServizio: true, tastoModifica: true }],
    Pazienti: [{ etichetta: "Pazienti" }],
  };
  const visualizzazioneTabella = colonnePerTipo[tipoLista] ?? [];

  const vociPerRuolo: Record<string, VoceMenu[]> = {
    Amministratore: [
      { etichetta: "Pazienti", descrizione: "Visualizza e gestisci i pazienti del sistema", immagine: "bi-people", link: () => listaUtenti("Pazienti") },
      { etichetta: "Medici", descrizione: "Visualizza e gestisci i medici del sistema", immagine: "bi-heart-pulse", link: () => listaUtenti("Medici") },
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
  const nomeVisualizzato = ruolo === "Amministratore" ? "Amministratore" : `${localStorage.getItem("nome")} ${localStorage.getItem("cognome")}`;

  function cambiaModalita(sezione: "listaUtenti" | "creaMedico") {
    setsezioneContent(sezione);
    setUsername("");
    setPassword("");
    setNome("");
    setCognome("");
    setSesso(0);
    setDataNascita("");
    setCodiceFiscale("");
  }

  async function creaMedico(e: React.SubmitEvent) {
    e.preventDefault();

    const risposta = await fetch(`${API_URL}/api/Medici`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ nome, cognome, tipologiaVisite: servizi, sesso, dataNascita, codiceFiscale, username, password }),
    });

    if (risposta.ok) {
      getGenerico("Medici");
    } else {
      setErrore("Utente già esistente o dati non validi");
    }
  }

  async function getGenerico(percorso: string) {
    const risposta = await fetch(`${API_URL}/api/${percorso}`, {
      method: "GET",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    if (!risposta.ok) {
      setErrore("Dati non validi");
      return;
    }
    return risposta.json();
  }

  async function putGenerico(percorso: string) {
    const risposta = await fetch(`${API_URL}/api/${percorso}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(form),
    });

    if (!risposta.ok) setErrore("Errore nella modifica");
  }

  async function mostraAnagrafica() {
    const dati = await getGenerico(`${rottaPerRuolo[ruolo]}/${localStorage.getItem("id")}`);
    setUser(dati);
    setsezioneContent("anagrafica");
    setTipoLista(rottaPerRuolo[ruolo]);
  }

  async function listaUtenti(tipoUtente: string) {
    const dati = await getGenerico(`${tipoUtente}`);
    setUsers(dati);
    setsezioneContent("listaUtenti");
    setTipoLista(tipoUtente);
  }

  async function listaTipologiaVisita() {
    const dati = await getGenerico("TipologiaVisita");
    setTipologiaVisite(dati);
    return dati;
  }

  async function modificaAnagrafica(e: React.SubmitEvent) {
    e.preventDefault();
    await putGenerico(`${rottaPerRuolo[ruolo]}/${user?.id}`);
    setSezioneAnagrafica("visualizza");
    await mostraAnagrafica();
  }

  async function modificalistaUtenti(e: React.SubmitEvent) {
    e.preventDefault();
    await putGenerico(`${tipoLista}/${user?.id}`);
    listaUtenti(tipoLista);
  }

  async function cancellaUser(id: string) {
    const risposta = await fetch(`${API_URL}/api/${tipoLista}/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    if (!risposta.ok) {
      setErrore("Errore nella cancellazione");
      return;
    }
    listaUtenti(tipoLista);
  }

  async function mostraPrenotazioni() {}
  async function mostraRecensioni() {}

  // async function modificaAnagrafica(e: React.SubmitEvent) {
  //   e.preventDefault();

  //   const risposta = await fetch(`${API_URL}/api/${ruolo === "Amministratore" ? tipoLista : (rottaPerRuolo[ruolo] ?? "")}/${user?.id}`, {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + localStorage.getItem("token"),
  //     },
  //     body: JSON.stringify(form),
  //   });

  //   if (!risposta.ok) {
  //     setErrore("Errore nella modifica");
  //     return;
  //   }

  //   if (tipoLista === "Medici") setsezioneContent("listaUtenti");
  //   if (tipoLista === "Pazienti") {
  //     setSezioneAnagrafica("visualizza");
  //     mostraAnagrafica();
  //   }
  // }

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
      <header className="header">
        <nav className="navbar navbar-expand-lg text-white" aria-label="Header">
          <div className="container-fluid">
            <button
              className="btn navbar-brand"
              onClick={() => {
                setsezioneContent("cards");
              }}
            >
              <img src={logo} alt="Bootstrap" width="50" height="44" />
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
                  <button className="nav-link fw-bold text-white" data-bs-toggle="modal" data-bs-target="#modalLogin" onClick={eseguiLogout}>
                    LOGOUT<i className="bi bi-door-open ms-2" style={{ fontSize: "2rem" }}></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav className={`${styles.sidebar} flex-shrink-0 p-3 ${sidebarChiusa ? "collapsed" : ""}`} aria-label="Sidebar">
          <button className={`toggle-btn btn ${styles.toggleBtn}`} onClick={toggleSidebar}>
            <i className="bi bi-chevron-double-left fs-4"></i>
          </button>
          <div className={`nav flex-column mt-3 ${styles.menuSidebar}`}>
            {vociSidebar.map((voce) => (
              <button
                key={voce.etichetta}
                className={`d-flex align-items-center btn ${styles.sidebarLink} text-decoration-none p-3 fs-5`}
                onClick={() => {
                  setTipoLista(voce.etichetta);
                  voce.link();
                }}
              >
                <i className={`bi ${voce.immagine} me-3`}></i>
                <span className={`${styles.hideOnCollapse}`}>{voce.etichetta}</span>
              </button>
            ))}
          </div>
        </nav>
        {/* Content Area */}
        <div className={`flex-grow-1 m-4 ${styles.contentArea}`}>
          <div className="m-4">
            {sezioneContent === "cards" && (
              /* Cards */
              <div className="row justify-content-evenly">
                {vociSidebar.map((voce) => (
                  <div key={voce.etichetta} className={`${colClass} p-3 ${styles.cardBorder}`}>
                    <button className="btn p-0 w-100 border-0" onClick={voce.link}>
                      <div className={`card p-0 ${styles.cardContent}`}>
                        <div className={`card-header text-white ${styles.titleMedisport}`}>
                          <h4 className="card-title text-center">{voce.etichetta}</h4>
                        </div>
                        <figure className="card-img-top text-center m-0">
                          <i className={`bi ${voce.immagine} d-block`} style={{ fontSize: "7rem", color: "#08808E" }}></i>
                        </figure>
                        <div className="card-body bg-white text-center py-2">
                          <p className="card-text">{voce.descrizione}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {sezioneContent === "listaUtenti" && (
              <div className="row g-0">
                <div className={`p-3  ${styles.cardBorder}`}>
                  {visualizzazioneTabella.map((colonna) => (
                    <div className={`card ${styles.projectListTableColor}`} key={colonna.etichetta}>
                      <div className={`card-header text-white ${styles.titleMedisport}`}>
                        <div className="row">
                          <div className="col-6">
                            <h5 className="m-2">
                              Lista {colonna.etichetta} ({totaleUsers})
                            </h5>
                          </div>
                          <div className="col-6 d-flex justify-content-end">
                            {colonna.buttonNew && (
                              <button
                                className="btn btn-success"
                                data-bs-toggle="modal"
                                data-bs-target="#modalNew"
                                onClick={() => {
                                  listaTipologiaVisita();
                                  cambiaModalita("creaMedico");
                                }}
                              >
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
                                    {colonna.tipologiaServizio && (
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
                                      {colonna.tipologiaServizio && <td>{user.tipologiaVisite?.[0]?.descrizione ? user.tipologiaVisite[0].descrizione : "N/A"}</td>}
                                      <td>
                                        {new Date(user.dataNascita).toLocaleDateString("it-IT", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })}
                                      </td>
                                      <td>{user.sesso === 0 ? "Maschio" : "Femmina"}</td>
                                      <td>{user.codiceFiscale ? user.codiceFiscale : "N/A"}</td>
                                      <td>
                                        <ul className="list-inline m-0 colonnaGestione">
                                          {colonna.tastoModifica && (
                                            <li className="list-inline-item">
                                              <button
                                                className="btn px-2 text-primary"
                                                title="Modifica"
                                                onClick={() => {
                                                  listaTipologiaVisita().then(() => {
                                                    setUser(user);
                                                    setForm({
                                                      nome: user?.nome ?? "",
                                                      cognome: user?.cognome ?? "",
                                                      tipologiaVisite: user?.tipologiaVisite ?? [],
                                                      codiceFiscale: user?.codiceFiscale ?? "",
                                                      sesso: user?.sesso ?? 0,
                                                      dataNascita: user?.dataNascita ?? "",
                                                    });
                                                    setsezioneContent("anagrafica");
                                                    setSezioneAnagrafica("modifica");
                                                  });
                                                }}
                                              >
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
                                            <button className={`btn px-2 text-danger`} title="Cancella" onClick={() => cancellaUser(user.id.toString())}>
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
                              Mostrando {totaleUsers === 0 ? 0 : inizio + 1} a {Math.min(inizio + PER_PAGINA, totaleUsers)} di {totaleUsers} totali
                            </p>
                          </div>
                        </div>
                        <div className="col-sm-6 me-0">
                          <div className="float-sm-end">
                            <ul className="pagination mb-sm-0">
                              <li className={`page-item ${pagina <= 1 ? "disabled" : ""}`}>
                                <button className="btn page-link" onClick={() => setPagina(pagina - 1)} disabled={pagina <= 1}>
                                  <i className="bi bi-chevron-left"></i>
                                </button>
                              </li>
                              <li className="page-item">
                                <div className="btn-toolbar" role="toolbar">
                                  <div className="btn-group">
                                    {Array.from({ length: totalePagine }, (_, indice) => (
                                      <button key={indice} className={`btn btn-primary ${pagina === indice + 1 ? "active" : ""}`} onClick={() => setPagina(indice + 1)}>
                                        {indice + 1}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </li>
                              <li className={`page-item ${pagina >= totalePagine ? "disabled" : ""}`}>
                                <button className="btn page-link" onClick={() => setPagina(pagina + 1)} disabled={pagina >= totalePagine}>
                                  <i className="bi bi-chevron-right"></i>
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sezioneContent === "creaMedico" && (
              <div className={` col-lg-6 mb-5 mb-lg-0 p-3 ${styles.cardBorder}`}>
                <div className=" card bg-body-tertiary">
                  <div className="card-body p-5 shadow-5 text-center">
                    <h2 className="fw-bold mb-5">Registra nuovo medico</h2>
                    <form
                      onSubmit={(e) => {
                        creaMedico(e).then(() => listaUtenti("Medici"));
                      }}
                    >
                      <div className="row">
                        <div className="col-md-5 mb-4">
                          <div className="form-floating">
                            <input type="text" id="Nome" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
                            <label htmlFor="Nome">Nome</label>
                          </div>
                        </div>
                        <div className="col-md-5 mb-4">
                          <div className="form-floating">
                            <input type="text" id="Cognome" className="form-control" value={cognome} onChange={(e) => setCognome(e.target.value)} required />
                            <label htmlFor="Cognome">Cognome</label>
                          </div>
                        </div>
                        <div className="col-md-2 mb-4">
                          <div className="form-floating">
                            <select className="form-select" id="sesso" value={sesso} onChange={(e) => setSesso(Number.parseInt(e.target.value))} required>
                              <option value=""></option>
                              <option value="0">M</option>
                              <option value="1">F</option>
                            </select>
                            <label htmlFor="sesso">Sesso</label>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4 mb-4">
                          <div className="form-floating">
                            <input type="date" id="DataNascita" className="form-control" value={dataNascita} onChange={(e) => setDataNascita(e.target.value)} required />
                            <label htmlFor="DataNascita">Data di nascita</label>
                          </div>
                        </div>
                        <div className="col-md-4 mb-4">
                          <div className="form-floating">
                            <input type="text" id="CodiceFiscale" className="form-control" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} />
                            <label htmlFor="CodiceFiscale">Codice fiscale</label>
                          </div>
                        </div>
                        <div className="col-md-4 mb-4">
                          <div className="form-floating">
                            <select
                              className="form-select"
                              id="servizi"
                              value={servizi[0]?.id ?? ""}
                              onChange={(e) => {
                                const servizio = tipologiaVisite?.find((t) => t.id === Number(e.target.value));
                                if (servizio) setServizi([servizio]);
                              }}
                            >
                              <option value=""></option>
                              {tipologiaVisite?.map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.descrizione}
                                </option>
                              ))}
                            </select>
                            <label htmlFor="servizi">Servizi</label>
                          </div>
                        </div>
                      </div>
                      <div className="form-floating mb-4">
                        <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} id="username" />
                        <label htmlFor="username">username</label>
                      </div>
                      <div className="form-floating mb-4">
                        <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} id="Password" />
                        <label htmlFor="Password">Password</label>
                      </div>
                      <div className="row">
                        <div className="d-flex justify-content-evenly">
                          <button type="submit" className="btn btn-success btn-block mb-4">
                            Registrati
                          </button>
                          <button type="button" className="btn btn-danger btn-block mb-4" onClick={() => listaUtenti("Medici")}>
                            Annulla
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {sezioneContent === "anagrafica" && (
              /* Anagrafica */
              <div className="row g-0">
                <div className={`col-6 p-3 ${styles.cardBorder}`}>
                  <div className="card">
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      <h5 className="m-2">Anagrafica</h5>
                    </div>
                    {sezioneAnagrafica === "visualizza" && (
                      <div className="card-body">
                        <table className="table">
                          <tbody>
                            <tr>
                              <th scope="row">Nome</th>
                              <td>{user?.nome}</td>
                            </tr>
                            <tr>
                              <th scope="row">Cognome</th>
                              <td>{user?.cognome}</td>
                            </tr>
                            {ruolo == "Medico" && (
                              <tr>
                                <th scope="row">Servizi</th>
                                <td>{user?.tipologiaVisite?.[0]?.descrizione}</td>
                              </tr>
                            )}
                            <tr>
                              <th scope="row">Codice Fiscale</th>
                              <td>{user?.codiceFiscale ?? "/"}</td>
                            </tr>
                            <tr>
                              <th scope="row">Data di Nascita</th>
                              <td>{new Date(user?.dataNascita ?? "").toLocaleDateString("it-IT")}</td>
                            </tr>
                            <tr>
                              <th scope="row">Sesso</th>
                              <td>{user?.sesso === 0 ? "Maschio" : "Femmina"} </td>
                            </tr>
                          </tbody>
                        </table>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            listaTipologiaVisita().then(() => {
                              setForm({
                                nome: user?.nome ?? "",
                                cognome: user?.cognome ?? "",
                                dataNascita: user?.dataNascita ?? "",
                                codiceFiscale: user?.codiceFiscale ?? "",
                                sesso: user?.sesso ?? 0,
                                tipologiaVisite: user?.tipologiaVisite ?? [],
                              });
                              setSezioneAnagrafica("modifica");
                            });
                          }}
                        >
                          Modifica
                        </button>
                      </div>
                    )}
                    {sezioneAnagrafica === "modifica" && (
                      <div className="form-floating card-body">
                        <form
                          onSubmit={(e) => {
                            if (ruolo === "Amministratore") modificalistaUtenti(e);
                            else modificaAnagrafica(e);
                          }}
                        >
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
                              {tipoLista == "Medici" && (
                                <tr>
                                  <th scope="row">Servizi</th>
                                  <td>
                                    <select disabled id="Servizi" className="form-select disabled" value={form?.tipologiaVisite?.[0]?.id}>
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
                                  <input
                                    type="text"
                                    id="CodiceFiscale"
                                    className="form-control"
                                    value={form?.codiceFiscale ?? "/"}
                                    onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value })}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Data di Nascita</th>
                                <td>
                                  <input
                                    type="date"
                                    id="DataNascita"
                                    className="form-control"
                                    value={form?.dataNascita?.split("T")[0]}
                                    onChange={(e) => setForm({ ...form, dataNascita: e.target.value })}
                                    required
                                  />
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Sesso</th>
                                <td>
                                  <select id="Sesso" className="form-select" value={form?.sesso} onChange={(e) => setForm({ ...form, sesso: Number(e.target.value) })} required>
                                    <option value="">Seleziona</option>
                                    <option value="0">Maschio</option>
                                    <option value="1">Femmina</option>
                                  </select>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <button type="submit" className="btn btn-success me-5">
                            Modifica
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => (ruolo == "Amministratore" ? setsezioneContent("listaUtenti") : setSezioneAnagrafica("visualizza"))}>
                            Annulla
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {errore && (
            <div className="toast-container position-fixed bottom-0 end-0 p-5">
              <div className="toast show bg-warning" role="alert" aria-live="assertive" aria-atomic="true">
                <div className="toast-header ">
                  <strong className="me-auto">Errore</strong>
                  <button type="button" className="btn-close" onClick={() => setErrore("")}></button>
                </div>
                <div className="toast-body">{errore}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AreaPersonale;
