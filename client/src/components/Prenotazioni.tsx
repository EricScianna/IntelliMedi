import { useState } from "react";
import type { TipologiaVisita } from "../types";
import { GIORNI_SETTIMANA } from "../constants";
import styles from "../pages/AreaPersonale.module.css";
import stylesShared from "../shared.module.css";
import GrigliaCalendario from "./GrigliaCalendario";

function titoloCella(isPaziente: boolean, giornoDisponibile: boolean): string {
  if (isPaziente) return giornoDisponibile ? "Clicca per prenotare" : "";
  return giornoDisponibile ? "Clicca per rimuovere" : "Clicca per rendere disponibile";
}

function Prenotazioni({
  isPaziente,
  onAggiungiFascia,
  giorniSettimana,
  grigliaOre,
  isGiornoDisponibile,
  onClickCasella,
  caricaDisponibilita,
  tipologiaVisite,
  onPrenota,
  onDisdici,
  caricaAppuntamento,
  statoCellaPaziente,
  statoCellaMedico,
}: Readonly<{
  isPaziente: boolean;
  onAggiungiFascia: (giorno: number, oraInizio: number, oraFine: number) => void;
  giorniSettimana: Date[];
  grigliaOre: number[];
  isGiornoDisponibile: (giorno: Date, ora: number) => boolean;
  onClickCasella: (giorno: Date, ora: number) => void;
  caricaDisponibilita: (id: string) => void;
  tipologiaVisite: TipologiaVisita[] | null;
  onPrenota: (giorno: Date, ora: number, tipologiaSelezionata: number | null, descrizione: string | null) => void;
  onDisdici: (giorno: Date, ora: number, tipologiaSelezionata: string | null) => void;
  caricaAppuntamento: (id: string) => void;
  statoCellaPaziente: (giorno: Date, ora: number) => string;
  statoCellaMedico: (giorno: Date, ora: number) => string;
}>) {
  const [mostraFormFasciaDisponibilita, setMostraFormFasciaDisponibilita] = useState(false);
  const [giornoGestioneDisponibilita, setGiornoGestioneDisponibilita] = useState(1);
  const [oraInizioGestioneDisponibilita, setOraInizioGestioneDisponibilita] = useState(8);
  const [oraFineGestioneDisponibilita, setOraFineGestioneDisponibilita] = useState(19);
  const [tipologiaSelezionata, setTipologiaSelezionata] = useState<number | null>(null);

  const coloreCella = (giorno: Date, ora: number) => {
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
    return coloreCella ?? "";
  };
  const onClickCella = (giorno: Date, ora: number) => {
    if (isPaziente) {
      if (giornoDisponibile && controlloCella === "prenotabile") onPrenota(giorno, ora, tipologiaSelezionata, null);
      else if (giornoDisponibile && controlloCella === "mio") onDisdici(giorno, ora, tipologiaSelezionata?.toString() ?? "");
    } else if (controlloCella === "prenotabile" || controlloCella === "na") onClickCasella(giorno, ora);
    else if (controlloCella === "prenotato") onDisdici(giorno, ora, tipologiaSelezionata?.toString() ?? "");
  };
  return (
    <div className={styles.prenotazioniContainer}>
      <div className="row g-0">
        <div className={`p-3  ${stylesShared.cardBorder}`}>
          {(!isPaziente || tipologiaSelezionata !== null) && (
            <div className={`card ${styles.projectListTableColor}`}>
              <div className={`card-header text-white ${styles.titleMedisport}`}>
                <div className="row">
                  <div className="col-6">
                    <h5 className="m-2">Calendario prenotazioni</h5>
                  </div>
                  <div className="col-6 d-flex justify-content-end">
                    {!isPaziente && (
                      <button className="btn btn-success" onClick={() => setMostraFormFasciaDisponibilita((v) => !v)}>
                        <i className="bi-plus-lg"></i> Fascia oraria
                      </button>
                    )}
                    {isPaziente && (
                      <div className="container">
                        <div className="row align-items-center">
                          <div className="col-sm-12 col-md-5">
                            <span className="text-white fw-bold fs-4">PRENOTA LA TUA VISITA</span>
                          </div>
                          <div className="col-12 col-md-7 d-flex flex-column flex-md-row ">
                            <select
                              id="selTipologia"
                              className="form-select rounded-pill d-inline"
                              value={tipologiaSelezionata ?? ""}
                              onChange={(e) => {
                                const id = Number(e.target.value);
                                setTipologiaSelezionata(id);
                                caricaDisponibilita(id.toString());
                                caricaAppuntamento(id.toString());
                              }}
                            >
                              <option value="">—</option>
                              {tipologiaVisite?.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.descrizione}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    {mostraFormFasciaDisponibilita && (
                      <div className={`${styles.pannelloDisponibilita} me-4`}>
                        <div className={`d-flex gap-3 align-items-end p-3 ${stylesShared.cardBorder}`}>
                          <div>
                            <label htmlFor="selGiorno" className="form-label">
                              Giorno
                            </label>
                            <select id="selGiorno" className="form-select" value={giornoGestioneDisponibilita} onChange={(e) => setGiornoGestioneDisponibilita(Number(e.target.value))}>
                              {GIORNI_SETTIMANA.map((giorno) => (
                                <option key={giorno.indice} value={giorno.indice}>
                                  {giorno.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="selOraInizio" className="form-label">
                              Dalle
                            </label>
                            <select id="selOraInizio" className="form-select" value={oraInizioGestioneDisponibilita} onChange={(e) => setOraInizioGestioneDisponibilita(Number(e.target.value))}>
                              {grigliaOre.map((ora) => (
                                <option key={ora} value={ora}>
                                  {ora.toString().padStart(2, "0")}:00
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="selOraFine" className="form-label">
                              Alle
                            </label>
                            <select id="selOraFine" className="form-select" value={oraFineGestioneDisponibilita} onChange={(e) => setOraFineGestioneDisponibilita(Number(e.target.value))}>
                              {grigliaOre.map((ora) => (
                                <option key={ora} value={ora}>
                                  {ora.toString().padStart(2, "0")}:00
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => {
                              onAggiungiFascia(giornoGestioneDisponibilita, oraInizioGestioneDisponibilita, oraFineGestioneDisponibilita);
                              setMostraFormFasciaDisponibilita(false);
                            }}
                          >
                            <i className="bi-check-lg"></i> Conferma
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-12">
                  <div className="table-responsive">
                    {!isPaziente && (
                      <div className="d-flex align-items-center gap-4 px-3 py-2">
                        <span className="text-muted">Clicca su una casella per aggiungere o rimuovere la tua disponibilità</span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-light`}></span>
                          <span> Libera</span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-success`}></span>
                          <span>Disponibile </span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-danger`}></span>
                          <span> Visita confermata</span>
                        </span>
                      </div>
                    )}
                    {isPaziente && (
                      <div className="d-flex align-items-center gap-4 px-3 py-2">
                        <span className="text-muted">Clicca su una casella per confermare/disdire la prenotazione:</span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-info`}></span>
                          <span> Disponibile</span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-success`}></span>
                          <span>Visita confermata </span>
                        </span>
                      </div>
                    )}
                    <GrigliaCalendario titoloCella={titoloCella(isPaziente, isGiornoDisponibile(giorno, ora))} coloreCella={coloreCella} giorniSettimana={giorniSettimana} grigliaOre={grigliaOre} onClickCella={onClickCella}></GrigliaCalendario>
                    {/* <table className={`table ${styles.tableSpace} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
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
                      </tbody>
                    </table> */}
                  </div>
                </div>
              </div>
            </div>
          )}
          {isPaziente && tipologiaSelezionata === null && (
            <div className="card">
              <div className={`card-header text-white ${styles.titleMedisport}`}>
                <h5 className="m-2">Prenota la tua visita</h5>
              </div>
              <div className="p-3">
                <select
                  id="selTipologia"
                  className="form-select"
                  value={tipologiaSelezionata ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setTipologiaSelezionata(id);
                    caricaDisponibilita(id.toString());
                    caricaAppuntamento(id.toString());
                  }}
                >
                  <option value="">—</option>
                  {tipologiaVisite?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.descrizione}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Prenotazioni;
