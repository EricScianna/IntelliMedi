import styles from "../pages/AreaPersonale.module.css";

function GrigliaCalendario({
  giorniSettimana,
  grigliaOre,
  coloreCella, 
  onClickCella,
  titoloCella
}: Readonly<{ giorniSettimana: Date[]; grigliaOre: number[]; coloreCella: (giorno: Date, ora: number) => string; onClickCella: (giorno: Date, ora: number) => void; titoloCella: () => string }>) {
  return (
    <table className={`table ${styles.tableSpace} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
      <thead>
        <tr>
          <th></th>
          {giorniSettimana.map((giorno) => (
            <th key={giorno.toISOString()} scope="col" className={`ps-4`}>
              {giorno.toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                weekday: "short",
              })}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grigliaOre.map((ora) => (
          <tr key={ora}>
            <th scope="row">{ora.toString().padStart(2, "0")}:00</th>
            {giorniSettimana.map((giorno) => (
              <td title={titoloCella} key={giorno.toISOString()} className={`${styles.cellStyle} ${coloreCella(giorno, ora)}`} onClick={() => onClickCella(giorno, ora)}></td>
            ))}
          </tr>
        ))}
      </tbody>
      {/* <tbody>
        {grigliaOre.map((ora) => (
          <tr key={ora}>
            <th scope="row">{ora.toString().padStart(2, "0")}:00</th>
            {giorniSettimana.map((giorno) => {
              const giornoDisponibile = isGiornoDisponibile(giorno, ora);
              let controlloCella;
              let coloreCella;
              if (isPaziente) {
                controlloCella = statoCellaPaziente(giorno, ora);
                if (controlloCella === "mio") coloreCella = "bg-success";
                if (controlloCella === "prenotabile") coloreCella = "bg-info";
                if (controlloCella === "pieno") coloreCella = "bg-light";
              } else {
                controlloCella = statoCellaMedico(giorno, ora);
                if (controlloCella === "prenotato") coloreCella = "bg-danger";
                if (controlloCella === "prenotabile") coloreCella = "bg-success";
                if (controlloCella === "na") coloreCella = "bg-light";
              }
              return (
                <td
                  title={titoloCella(isPaziente, giornoDisponibile)}
                  key={giorno.toISOString()}
                  // il paziente può cliccare solo sulle caselle verdi. medico e admin su tutte
                  className={`${styles.cellStyle} ${coloreCella} ${!isPaziente || giornoDisponibile ? styles.cellStylePointer : ""}`}
                  onClick={() => {
                    if (isPaziente) {
                      if (giornoDisponibile && controlloCella === "prenotabile") onPrenota(giorno, ora, tipologiaSelezionata, null);
                      else if (giornoDisponibile && controlloCella === "mio") onDisdici(giorno, ora, tipologiaSelezionata?.toString() ?? "");
                    } else if (controlloCella === "prenotabile" || controlloCella === "na") onClickCasella(giorno, ora);
                    else if (controlloCella === "prenotato") onDisdici(giorno, ora, tipologiaSelezionata?.toString() ?? "");
                  }}
                ></td>
              );
            })}
          </tr>
        ))}
      </tbody> */}
    </table>
  );
}
export default GrigliaCalendario;
