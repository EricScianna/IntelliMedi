import logo from "../assets/logo2.png";

function Header({ clickCards, nomeVisualizzato, clickLogout }: Readonly<{ clickCards: () => void; nomeVisualizzato: string; clickLogout: () => void }>) {
  return (
    <header className="header">
      <div className="container-fluid d-flex flex-column flex-lg-row align-items-lg-center text-white py-3">
        <button className="btn navbar-brand p-0" onClick={clickCards}>
          <img src={logo} alt="Logo" width="50" height="44" />
        </button>

        <div className="d-flex align-items-center justify-content-between flex-grow-1 ms-lg-5 mt-2 mt-lg-0">
          <span className="fs-4">Area personale di {nomeVisualizzato}</span>
          <button className="nav-link fw-bold text-white" onClick={clickLogout}>
            LOGOUT<i className="bi bi-door-open ms-2" style={{ fontSize: "2rem" }}></i>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
