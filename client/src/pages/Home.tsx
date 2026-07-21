import styles from "./Home.module.css";
import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import carousel1 from "../assets/carousel-1-1-1920x800.jpg";
import carousel2 from "../assets/carousel-2-1-1920x800.jpg";
import carousel3 from "../assets/carousel-3-1-1920x800.png";
import carousel4 from "../assets/carousel-4-1-1920x800.jpg";
import carousel5 from "../assets/carousel-5-1-1920x800.jpg";
import chiSiamo from "../assets/chi-siamo-home-720x415.png";
import { useNavigate } from "react-router-dom";

const servizi = ["Medicina sportiva", "Ortopedia", "Nutrizione", "Cardiologia", "Psicologia", "Fisioterapia", "Holter cardiaco", "Onde d'urto"];

interface Slide {
  immagine: string;
  didascalia?: { titolo: string; testo: string };
}

const slides: Slide[] = [
  { immagine: carousel5, didascalia: { titolo: "Poliambulatorio", testo: "Uno staff di medici specializzati al tuo servizio" } },
  { immagine: carousel1 },
  { immagine: carousel2 },
  { immagine: carousel3 },
  { immagine: carousel4 },
];

interface VoceNavbar {
  etichetta: string;
  tipo: string;
  attivo?: boolean;
  sottoVoci?: string[];
}

const vociNavbar: VoceNavbar[] = [
  { etichetta: "HOME", attivo: true, tipo: "link" },
  { etichetta: "CHI SIAMO", attivo: false, tipo: "link" },
  { etichetta: "SERVIZI", attivo: false, tipo: "dropdown", sottoVoci: servizi },
  { etichetta: "NEWS", attivo: false, tipo: "link" },
  { etichetta: "CONTATTI", attivo: false, tipo: "link" },
  { etichetta: "AREA PERSONALE", attivo: false, tipo: "login" },
];

function Home() {
  const [sticky, setSticky] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function aggiornaSticky() {
      setSticky(window.scrollY > 30 || window.innerWidth < 991);
    }
    aggiornaSticky();

    window.addEventListener("scroll", aggiornaSticky);
    window.addEventListener("resize", aggiornaSticky);

    return () => {
      window.removeEventListener("scroll", aggiornaSticky);
      window.removeEventListener("resize", aggiornaSticky);
    };
  }, []);

  return (
    <div className={styles.homePage}>
      <header className={`${styles.header} ${sticky ? styles.sticky : ""}`}>
        <nav className="navbar navbar-expand-md p-0">
          <div className="container-fluid ">
            <button className="btn navbar-brand me-0 py-3">
              <img src={logo} alt="MedisportLogo" />
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
              <ul className="navbar-nav align-items-center ms-auto mb-2 mb-lg-0 ">
                {vociNavbar.map((voce) => {
                  if (voce.tipo === "dropdown") {
                    return (
                      <li className="nav-item dropdown" key={voce.etichetta}>
                        <button
                          className={`nav-link d-flex align-items-center justify-content-center fw-bold dropdown-toggle me-1 ${styles.navLink}`}
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          {voce.etichetta}
                        </button>
                        <ul className="dropdown-menu">
                          {voce.sottoVoci?.map((servizio) => (
                            <li key={servizio}>
                              <button className="dropdown-item">{servizio}</button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  }
                  if (voce.tipo === "login") {
                    return (
                      <li className="nav-item" key={voce.etichetta}>
                        <button className={`nav-link d-flex align-items-center justify-content-center fw-bold ${styles.navLink}`} onClick={() => navigate("/login")}>
                          {voce.etichetta}
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li className="nav-item" key={voce.etichetta}>
                      <button className={`nav-link d-flex align-items-center justify-content-center fw-bold me-1 ${styles.navLink} ${voce.attivo ? "active" : ""}`}>{voce.etichetta}</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </nav>
      </header>
      <div id="carouselExampleAutoplaying" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          {slides.map((slide, indice) => (
            <button
              key={slide.immagine}
              type="button"
              data-bs-target="#carouselExampleAutoplaying"
              data-bs-slide-to={indice}
              className={indice === 0 ? "active" : ""}
              aria-current={indice === 0 ? "true" : undefined}
              aria-label={`Slide ${indice + 1}`}
            ></button>
          ))}
        </div>
        <div className="carousel-inner">
          {slides.map((slide, indice) => (
            <div className={`carousel-item ${indice === 0 ? "active" : ""}`} key={slide.immagine}>
              <img src={slide.immagine} className="d-block w-100" alt={`Slide ${indice + 1}`} />
              {slide.didascalia && (
                <div className="carousel-caption d-none d-md-block">
                  <h5>{slide.didascalia.titolo}</h5>
                  <p>{slide.didascalia?.testo}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
      <section className={`${styles.prenotaBar} py-3`}>
        <div className="container py-2">
          <div className="row gy-3 align-items-center">
            <div className="col-sm-12 col-md-5">
              <span className="text-white fw-bold fs-4">PRENOTA LA TUA VISITA</span>
            </div>
            <div className="col-12 col-md-7 d-flex flex-column flex-md-row gap-2">
              <select className="form-select form-select-lg rounded-pill d-inline">
                {servizi.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button className="btn btn-outline-light rounded-pill px-4 fw-bold" onClick={() => navigate("/login")}>
                PRENOTA
              </button>
            </div>
          </div>
        </div>
      </section>
      <div className="container">
        <div className="row">
          <div className="col-sm-12 col-md-6 fs-5 fw-light">
            <p className="my-5">
              Medisport è un poliambulatorio medico specialistico che opera sul territorio chivassese dal 1991. La nostra mission è quella di offrire un sempre maggiore e costante impegno e attenzione
              alla persona, intesa nella sua pluralità, al fine di progettare ed attuare le migliori strategie di cura monitorandone lo stato di salute e i miglioramenti ottenuti.
            </p>
            <p className="my-5">
              Questa attenzione costante ci ha permesso di sviluppare la nostra professionalità negli anni, continuando ad aggiornarci sia all’interno che all’esterno della nostra struttura.
            </p>
          </div>
          <div className="col-sm-12 col-md-6 fs-5 fw-light">
            <img src={chiSiamo} className="img-fluid rounded" alt="..." />
          </div>
        </div>
      </div>
    </div>
  );
}
export default Home;
