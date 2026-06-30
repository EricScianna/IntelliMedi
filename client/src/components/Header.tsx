import logo from "../assets/logo2.png";

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

export default Header;
