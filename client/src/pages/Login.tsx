import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import logo from "../assets/Logo3.png";

const API_URL = "https://localhost:7223";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [sesso, setSesso] = useState(0);
  const [dataNascita, setDataNascita] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [errore, setErrore] = useState("");
  const [sezione, setSezione] = useState<"login" | "registrazione">("login");
  const navigate = useNavigate();

  function cambiaModalita(sezione: "login" | "registrazione") {
    setSezione(sezione);
    setUsername("");
    setPassword("");
    setNome("");
    setCognome("");
    setSesso(0);
    setDataNascita("");
    setCodiceFiscale("");
    setErrore("");
  }

  async function handleLogin(e: React.SubmitEvent) {
    e.preventDefault();
    setErrore("");

    const risposta = await fetch(`${API_URL}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!risposta.ok) {
      setErrore("Username o password non corretti");
      return;
    }

    const dati = await risposta.json();

    localStorage.setItem("token", dati.token);
    localStorage.setItem("id", String(dati.utente.id));
    localStorage.setItem("ruolo", dati.utente.ruolo);
    localStorage.setItem("nome", dati.utente.nome);
    localStorage.setItem("cognome", dati.utente.cognome);

    navigate("/area-personale");
  }

  async function handleSignUp(e: React.SubmitEvent) {
    e.preventDefault();
    setErrore("");

    const risposta = await fetch(`${API_URL}/api/Pazienti`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cognome, sesso, dataNascita, codiceFiscale, username, password }),
    });

    if (risposta.ok) {
      handleLogin(e);
    } else {
      setErrore("Utente già esistente o dati non validi");
    }
  }

  return (
    <section className={`min-vh-100 d-flex align-items-center text-center text-lg-start ${styles.background}`}>
      <div className="container py-4 align-items-center">
        <div className= "row g-0 align-items-center">
          <div className=" col-lg-6 mb-5 mb-lg-0">
            <div className={styles.cascadingRight + " card bg-body-tertiary"}>
              {sezione === "login" && (
                <div className="card-body p-5 shadow-5 text-center">
                  <h2 className="fw-bold mb-5">Accedi all'area personale</h2>
                  <form onSubmit={handleLogin}>
                    <div className="form-floating mb-4">
                      <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} id="username" />
                      <label htmlFor="username">Username</label>
                    </div>
                    <div className="form-floating mb-4">
                      <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} id="Password" />
                      <label htmlFor="Password">Password</label>
                    </div>
                    <button type="submit" data-mdb-button-init data-mdb-ripple-init className="btn btn-primary btn-block mb-4">
                      Accedi
                    </button>
                    <div className="text-center">
                      <p>
                        Non sei registrato?{" "}
                        <button className="fw-bold btn btn-link p-0 align-baseline" onClick={() => cambiaModalita("registrazione")}>
                          Registrati
                        </button>
                      </p>
                    </div>
                    {errore && <div className="alert alert-danger">{errore}</div>}
                  </form>
                </div>
              )}
              {sezione === "registrazione" && (
                <div className="card-body p-5 shadow-5 text-center">
                  <h2 className="fw-bold mb-5">Registrati all'area personale</h2>
                  <form onSubmit={handleSignUp}>
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
                          <input type="date" id="DataNascita" className="form-control" value={dataNascita} onChange={(e) => setDataNascita(e.target.value)} />
                          <label htmlFor="DataNascita">Data di nascita</label>
                        </div>
                      </div>
                      <div className="col-md-8 mb-4">
                        <div className="form-floating">
                          <input type="text" id="CodiceFiscale" className="form-control" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} />
                          <label htmlFor="CodiceFiscale">Codice fiscale</label>
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
                    <button type="submit" data-mdb-button-init data-mdb-ripple-init className="btn btn-primary btn-block mb-4">
                      Registrati
                    </button>
                    <div className="text-center">
                      <p>
                        Già registrato?{" "}
                        <button className="fw-bold btn btn-link p-0 align-baseline" onClick={() => cambiaModalita("login")}>
                          Accedi
                        </button>
                      </p>
                    </div>
                    {errore && <div className="alert alert-danger">{errore}</div>}
                  </form>
                </div>
              )}
            </div>
          </div>
          <div className={`col-lg-6 mb-5 mb-lg-0 ${styles.imageBackground}`}>
            <img src={logo} className="w-100 rounded-4 shadow-4" alt="Logo" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
