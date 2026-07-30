import styles from "../styles/areaPersonale.module.css";
import type { VoceMenu } from "../types";

function Sidebar({ sidebarChiusa, clickToggleSidebar, vociSidebar }: Readonly<{ sidebarChiusa: boolean; clickToggleSidebar: () => void; vociSidebar: VoceMenu[] }>) {
  return (
    <nav className={`${styles.sidebar} flex-shrink-0 p-3 ${sidebarChiusa ? "collapsed" : ""}`} aria-label="Sidebar">
      <button className={`toggle-btn btn d-none d-lg-flex ${styles.toggleBtn}`} onClick={clickToggleSidebar}>
        <i className="bi bi-chevron-double-left fs-4"></i>
      </button>
      <div className={`nav flex-row flex-wrap flex-lg-column justify-content-around mt-3 gap-4 ${styles.menuSidebar}`}>
        {vociSidebar.map((voce) => (
          <button
            key={voce.etichetta}
            className={`d-flex align-items-center btn ${styles.sidebarLink} text-decoration-none m-0 fs-5`}
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
export default Sidebar;
