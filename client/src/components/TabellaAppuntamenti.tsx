import type { Appuntamento } from "../types";
import styles from "../styles/areaPersonale.module.css";

function formattaData(dataIso: string) {
  const d = new Date(dataIso);
  return {
    giorno: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }),
    ora: d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
  };
}

function TabellaAppuntamenti({
  intestazioneControparte,
  valoreControparte,
  appuntamenti,
  onCancella,
}: Readonly<{ appuntamenti: Appuntamento[] | null; intestazioneControparte: string; valoreControparte: (a: Appuntamento) => string; onCancella: (id: number) => void }>) {
  return (
    <table className={`table ${styles.projectListTable} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
      <thead>
        <tr>
          <th scope="col" className={`${styles.w20} ps-4`}>
            Tipologia Visita
          </th>
          <th className={`${styles.w20}`} scope="col">
            {intestazioneControparte}
          </th>
          <th className={`${styles.w20}`} scope="col">
            Giorno
          </th>
          <th className={`${styles.w20}`} scope="col">
            Ora
          </th>
          <th className={`${styles.w10}`} scope="col">
            Gestione
          </th>
        </tr>
      </thead>
      <tbody>
        {[...(appuntamenti ?? [])]
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
          .map((appuntamento) => {
            const { giorno, ora } = formattaData(appuntamento.data);
            return (
              <tr key={appuntamento.id}>
                <td className="ps-4">{appuntamento.tipologiaVisita}</td>
                <td>{valoreControparte(appuntamento)}</td>
                <td>{giorno}</td>
                <td>{ora}</td>
                <td>
                  <ul className="list-inline m-0">
                    <li className="list-inline-item position-relative">
                      <button className={`btn px-2 text-danger`} title="Cancella" onClick={() => onCancella(appuntamento.id)}>
                        <i className="bi bi-trash font-size-18"></i>
                      </button>
                    </li>
                  </ul>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
export default TabellaAppuntamenti;
