import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import logo from "../assets/logo3.png";
import type { DatiForm } from "../types";
import { API_URL, FORM_VUOTO } from "../constants";
import { useErrore } from "../hooks/useErrore";
import FormDatiUtente from "../components/FormDatiUtente";
import Avvisi from "../components/Avvisi";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<DatiForm>(FORM_VUOTO);
  const { errore, setErrore } = useErrore();
  const [sezione, setSezione] = useState<"login" | "registrazione">("login");
  const navigate = useNavigate();

  function cambiaModalita(sezione: "login" | "registrazione") {
    setSezione(sezione);
    setUsername("");
    setPassword("");
    setForm(FORM_VUOTO);
    setErrore("");
  }

  async function postLogin(e: React.SubmitEvent) {
    e.preventDefault();

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

    navigate("/area-personale");
  }

  async function postSignUp(e: React.SubmitEvent) {
    e.preventDefault();

    const risposta = await fetch(`${API_URL}/api/Pazienti`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, username, password }),
    });

    if (risposta.ok) {
      postLogin(e);
    } else {
      setErrore("Utente già esistente o dati non validi");
    }
  }

  return (
    <section className={`min-vh-100 d-flex align-items-center text-center text-lg-start ${styles.background}`}>
      <div className="container py-4 align-items-center">
        <div className="row g-0 align-items-center">
          <div className=" col-lg-6 mb-5 mb-lg-0">
            <div className={styles.cascadingRight + " card bg-body-tertiary"}>
              {sezione === "login" && (
                <div className="card-body p-5 shadow-5 text-center">
                  <h2 className="fw-bold mb-5">Accedi all'area personale</h2>
                  <form onSubmit={postLogin}>
                    <div className="form-floating mb-4">
                      <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} id="username" />
                      <label htmlFor="username">Username</label>
                    </div>
                    <div className="form-floating mb-4">
                      <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} id="Password" />
                      <label htmlFor="Password">Password</label>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block mb-4">
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
                    {errore && <Avvisi errore={errore} clickChiudi={() => setErrore("")} />}
                  </form>
                </div>
              )}
              {sezione === "registrazione" && (
                <FormDatiUtente
                  titolo="Registrati all'area personale"
                  submitUtente={(contenutoForm) => postSignUp(contenutoForm)}
                  form={form}
                  setForm={setForm}
                  isMostraServizi={false}
                  username={username}
                  password={password}
                  setUsername={setUsername}
                  setPassword={setPassword}
                >
                  <button type="submit" className="btn btn-primary btn-block mb-4">
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
                </FormDatiUtente>
              )}
              {errore && <Avvisi errore={errore} clickChiudi={() => setErrore("")} />}
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
