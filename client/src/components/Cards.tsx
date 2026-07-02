import styles from "../styles/areaRiservata.module.css";
import stylesShared from "../shared.module.css";
import type { VoceMenu } from "../types";

function Cards({ vociSidebar }: Readonly<{ vociSidebar: VoceMenu[] }>) {
  return (
    <div className="row justify-content-evenly">
      {vociSidebar.map((voce) => (
        <div key={voce.etichetta} className="col-12 col-sm-6 col-lg-3 g-4">
          <div className={`p-3 ${stylesShared.cardBorder} h-100`}>
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
        </div>
      ))}
    </div>
  );
}

export default Cards;
