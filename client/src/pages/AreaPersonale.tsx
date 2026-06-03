import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AreaPersonale.module.css";
import logo from "../assets/logo2.png";

const API_URL = "https://localhost:7223";

interface User {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  sesso: number;
}

interface Voce {
  etichetta: string;
  descrizione: string;
  immagine: string;
  link: () => void;
}

function AreaPersonale() {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [sesso, setSesso] = useState(0);
  const [dataNascita, setDataNascita] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [errore, setErrore] = useState("");
  const [successo, setSuccesso] = useState("");
  const navigate = useNavigate();
  const [sezione, setSezione] = useState<"cards" | "anagrafica" | "prenotazioni" | "recensioni" | "listaUtenti">("cards");
  const [sezioneAnagrafica, setSezioneAnagrafica] = useState<"visualizza" | "modifica">("visualizza");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarChiusa, setSidebarChiusa] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  const vociPerRuolo: Record<string, Voce[]> = {
    Amministratore: [
      { etichetta: "Pazienti", descrizione: "Visualizza e gestisci i pazienti del sistema", immagine: "bi-people", link: mostraListaUtenti },
      { etichetta: "Medici", descrizione: "Visualizza e gestisci i medici del sistema", immagine: "bi-heart-pulse", link: mostraAnagrafica },
      { etichetta: "Prenotazioni", descrizione: "Visualizza e gestisci le prenotazioni", immagine: "bi-calendar-check", link: mostraPrenotazioni },
      { etichetta: "Recensioni", descrizione: "Modera le recensioni", immagine: "bi-star-fill", link: mostraRecensioni },
    ],
    Paziente: [
      { etichetta: "Anagrafica", descrizione: "Visualizza e modifica i tuoi dati personali", immagine: "bi-person", link: mostraAnagrafica },
      { etichetta: "Prenotazioni", descrizione: "Gestisci le tue prenotazioni", immagine: "bi-calendar", link: mostraPrenotazioni },
      { etichetta: "Recensisci", descrizione: "Recensisci i servizi ricevuti", immagine: "bi-star-fill", link: mostraRecensioni },
    ],
  };

  const ruolo = localStorage.getItem("ruolo") ?? "";
  const vociSidebar = vociPerRuolo[ruolo] ?? [];
  const colClass = vociSidebar.length > 3 ? "col-5 g-5" : "col-3";

  if (ruolo == "Amministratore") {
    localStorage.setItem("nome", "Amministratore");
    localStorage.setItem("cognome", "");
  }

  async function mostraListaUtenti() {
    const risposta = await fetch(`${API_URL}/api/Pazienti`, {
      method: "GET",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    const listaUtentiRisposta = await risposta.json();
    console.log(listaUtentiRisposta);
    setSezione("listaUtenti");
  }

  async function mostraPrenotazioni() {}
  async function mostraRecensioni() {}

  async function mostraAnagrafica() {
    let userEndPoint = "";

    if (localStorage.getItem("ruolo") == "Paziente") {
      userEndPoint = `https://localhost:7223/api/pazienti/`;
    }
    const risposta = await fetch(userEndPoint + localStorage.getItem("id"), {
      method: "GET",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    const dati = await risposta.json();
    dati.dataNascita = new Date(dati.dataNascita).toLocaleDateString("it-IT");
    if (dati.sesso == 0) dati.sesso = "Maschio";
    else dati.sesso = "Femmina";

    setUser(dati);
    setSezione("anagrafica");
  }

  async function modificaAnagrafica(e: React.SubmitEvent) {
    e.preventDefault();

    const risposta = await fetch(`${API_URL}/api/Pazienti/${localStorage.getItem("id")}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ nome, cognome, sesso, dataNascita, codiceFiscale }),
    });

    if (risposta.ok) {
      setSezioneAnagrafica("visualizza");
      mostraAnagrafica();
      setSuccesso("Anagrafica aggiornata con successo");
      setErrore("");
    } else {
      setErrore("Errore nell'aggiornamento dell'anagrafica");
      setSuccesso("");
    }
  }

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
                setSezione("cards");
                setErrore("");
                setSuccesso("");
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
                <span>
                  Area riservata di {localStorage.getItem("nome")} {localStorage.getItem("cognome")}
                </span>
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
              <button className={`d-flex align-items-center btn ${styles.sidebarLink} text-decoration-none p-3 fs-5`} onClick={mostraAnagrafica} key={voce.etichetta}>
                <i className={`bi ${voce.immagine} me-3`}></i>
                <span className={`${styles.hideOnCollapse}`}>{voce.etichetta}</span>
              </button>
            ))}
          </div>
        </nav>
        {/* Content Area */}
        <div className={`flex-grow-1 m-4 ${styles.contentArea}`}>
          <div className="m-4">
            {sezione === "cards" && (
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
            {sezione === "listaUtenti" && (
              <div className="row g-0">
                <div className={`p-3  ${styles.cardBorder}`}>
                  <div className={`card ${styles.projectListTableColor}`}>
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      <h5 className="m-2">
                        Lista pazienti <span className="text-muted fw-normal ms-2">(834)</span>
                      </h5>
                    </div>
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="">
                          <div className="table-responsive">
                            <table className={`table ${styles.projectListTable} ${styles.projectListTableColor} align-middle table-borderless m-0`}>
                              <thead>
                                <tr>
                                  <th scope="col" className="ps-4">
                                    <div className="form-check font-size-16">
                                      <input type="checkbox" className="form-check-input" id="contacusercheck" />
                                    </div>
                                  </th>
                                  <th scope="col">Nome</th>
                                  <th scope="col">Cognome</th>
                                  <th scope="col">Età</th>
                                  <th scope="col">Sesso</th>
                                  <th scope="col">Codice Fiscale</th>
                                  <th scope="col">Gestione</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <th scope="row" className="ps-4">
                                    <div className="form-check font-size-16">
                                      <input type="checkbox" className="form-check-input" id="contacusercheck1" />
                                      <label className="form-check-label" htmlFor="contacusercheck1"></label>
                                    </div>
                                  </th>
                                  <td>Simon Ryles</td>
                                  <td>
                                    <span className="badge badge-soft-success mb-0">Full Stack Developer</span>
                                  </td>
                                  <td>SimonRyles@minible.com</td>
                                  <td>125</td>
                                  <td>125</td>
                                  <td>
                                    <ul className="list-inline mb-0">
                                      <li className="list-inline-item">
                                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" title="Edit" className="px-2 text-primary">
                                          <i className="bi bi-pencil font-size-18"></i>
                                        </a>
                                      </li>
                                      <li className="list-inline-item">
                                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" title="Delete" className="px-2 text-danger">
                                          <i className="bi bi-trash font-size-18"></i>
                                        </a>
                                      </li>
                                      <li className="list-inline-item dropdown">
                                        <a className="text-muted dropdown-toggle font-size-18 px-2" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true">
                                          <i className="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <div className="dropdown-menu dropdown-menu-end">
                                          <a className="dropdown-item" href="#">
                                            Visualizza prenotazioni
                                          </a>
                                        </div>
                                      </li>
                                    </ul>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 row g-0 align-items-center pb-4">
                      <div className="col-sm-6">
                        <div>
                          <p className="mb-sm-0">Mostrando 1 to 10 of 57 entries</p>
                        </div>
                      </div>
                      <div className="col-sm-6 me-0">
                        <div className="float-sm-end">
                          <ul className="pagination mb-sm-0">
                            <li className="page-item disabled">
                              <a href="#" className="page-link">
                                <i className="bi bi-chevron-left"></i>
                              </a>
                            </li>
                            <li className="page-item active">
                              <a href="#" className="page-link">
                                1
                              </a>
                            </li>
                            <li className="page-item">
                              <a href="#" className="page-link">
                                2
                              </a>
                            </li>
                            <li className="page-item">
                              <a href="#" className="page-link">
                                3
                              </a>
                            </li>
                            <li className="page-item">
                              <a href="#" className="page-link">
                                4
                              </a>
                            </li>
                            <li className="page-item">
                              <a href="#" className="page-link">
                                5
                              </a>
                            </li>
                            <li className="page-item">
                              <a href="#" className="page-link">
                                <i className="bi bi-chevron-right"></i>
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sezione === "anagrafica" && (
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
                            <tr>
                              <th scope="row">Codice Fiscale</th>
                              <td>{user?.codiceFiscale ?? "/"}</td>
                            </tr>
                            <tr>
                              <th scope="row">Data di Nascita</th>
                              <td>{user?.dataNascita}</td>
                            </tr>
                            <tr>
                              <th scope="row">Sesso</th>
                              <td>{user?.sesso} </td>
                            </tr>
                          </tbody>
                        </table>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            setSezioneAnagrafica("modifica");
                            setErrore("");
                            setSuccesso("");
                          }}
                        >
                          Modifica
                        </button>
                      </div>
                    )}
                    {sezioneAnagrafica === "modifica" && (
                      <div className="form-floating card-body">
                        <form onSubmit={modificaAnagrafica}>
                          <table className="table">
                            <tbody>
                              <tr>
                                <th scope="row">Nome</th>
                                <td>
                                  <input type="text" id="Nome" className="form-control" defaultValue={user?.nome} onChange={(e) => setNome(e.target.value)} required />
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Cognome</th>
                                <td>
                                  <input type="text" id="Cognome" className="form-control" defaultValue={user?.cognome} onChange={(e) => setCognome(e.target.value)} required />
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Codice Fiscale</th>
                                <td>
                                  <input
                                    type="text"
                                    id="CodiceFiscale"
                                    className="form-control"
                                    defaultValue={user?.codiceFiscale ?? "/"}
                                    onChange={(e) => setCodiceFiscale(e.target.value)}
                                    required
                                  />
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Data di Nascita</th>
                                <td>
                                  <input type="date" id="DataNascita" className="form-control" defaultValue={user?.dataNascita} onChange={(e) => setDataNascita(e.target.value)} required />
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Sesso</th>
                                <td>
                                  <select id="Sesso" className="form-control" defaultValue={user?.sesso} onChange={(e) => setSesso(Number.parseInt(e.target.value))} required>
                                    <option value="">Seleziona</option>
                                    <option value="0">Maschio</option>
                                    <option value="1">Femmina</option>
                                  </select>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <button type="submit" className="btn btn-success me-5" onClick={mostraAnagrafica}>
                            Accetta
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => setSezioneAnagrafica("visualizza")}>
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
          {successo && <div className="col-3 p-3 m-4 alert alert-success">{successo}</div>}
          {errore && <div className="col-3 p-3 m-4 alert alert-danger">{errore}</div>}
        </div>
      </div>
    </div>
  );
}

export default AreaPersonale;
