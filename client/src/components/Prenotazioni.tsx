import styles from "../pages/AreaPersonale.module.css";
import stylesShared from "../shared.module.css";
import { useState } from "react";
import { GIORNI_SETTIMANA } from "../constants";
import { useUtente } from "../context/UtenteContext";
import type { DisponibilitaMedico, User, TipologiaVisita, Appuntamento } from "../types";
import ConfermaEliminazione from "./ConfermaEliminazione";
import TabellaAppuntamenti from "./TabellaAppuntamenti";

function Prenotazioni({
  onAggiungiFascia,
  giorniSettimana,
  onSettimanaPrecedente,
  onSettimanaSuccessiva,
  grigliaOre,
  isGiornoDisponibile,
  onClickCasella,
  onCaricaDisponibilitaPerTipologia,
  onCaricaDisponibilitaPerMedico,
  onCaricaMediciPerTipologia,
  tuttiMedici,
  tuttiPazienti,
  mediciTipologia,
  tipologiaVisite,
  onPrenota,
  onDisdici,
  onDisdiciById,
  onCaricaAppuntamentoPerTipologia,
  onCaricaAppuntamentoPerMedico,
  appuntamenti,
  statoCellaPaziente,
  statoCellaMedico,
  utenteSelezionato,
  pazienteSelezionatoId,
  setPazienteSelezionatoId,
  tipoLista,
  sezionePrenotazioni,
  setSezionePrenotazioni,
  onMostraPrenotazioni,
  isNuovaPrenotazioneAdmin,
  idUtente,
}: Readonly<{
  onAggiungiFascia: (giorno: number, oraInizio: number, oraFine: number) => void;
  giorniSettimana: Date[];
  onSettimanaPrecedente: () => void;
  onSettimanaSuccessiva: () => void;
  grigliaOre: number[];
  isGiornoDisponibile: (giorno: Date, ora: number) => boolean;
  onClickCasella: (giorno: Date, ora: number) => void;
  onCaricaDisponibilitaPerTipologia: (id: string) => Promise<void>;
  onCaricaDisponibilitaPerMedico: (id: string) => Promise<void>;
  onCaricaMediciPerTipologia: (id: string) => Promise<void>;
  tuttiMedici: DisponibilitaMedico[] | null;
  tuttiPazienti: User[] | null;
  mediciTipologia: DisponibilitaMedico[] | null;
  tipologiaVisite: TipologiaVisita[] | null;
  onPrenota: (giorno: Date, ora: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null) => void;
  onDisdici: (giorno: Date, ora: number, tipologiaSelezionataId: string | null, medicoSelezionatoId?: string | null) => void;
  onDisdiciById: (tipologiaSelezionataId: string) => void;
  onCaricaAppuntamentoPerTipologia: (id: string) => Promise<void>;
  onCaricaAppuntamentoPerMedico: (id: string) => Promise<void>;
  appuntamenti: Appuntamento[] | null;
  statoCellaPaziente: (giorno: Date, ora: number) => string;
  statoCellaMedico: (giorno: Date, ora: number) => string;
  utenteSelezionato: User | null;
  pazienteSelezionatoId: string;
  setPazienteSelezionatoId: React.Dispatch<React.SetStateAction<string>>;
  tipoLista: string;
  sezionePrenotazioni: string;
  setSezionePrenotazioni: React.Dispatch<React.SetStateAction<"nuovaPrenotazioneCalendario" | "visualizzaPrenotazioni" | "nuovaPrenotazioneAdmin">>;
  onMostraPrenotazioni: (id: string) => void;
  isNuovaPrenotazioneAdmin: boolean;
  idUtente: string;
}>) {
  const [mostraFormFasciaDisponibilita, setMostraFormFasciaDisponibilita] = useState(false);
  const [giornoGestioneDisponibilita, setGiornoGestioneDisponibilita] = useState(1);
  const [oraInizioGestioneDisponibilita, setOraInizioGestioneDisponibilita] = useState(8);
  const [oraFineGestioneDisponibilita, setOraFineGestioneDisponibilita] = useState(19);
  const [tipologiaSelezionataId, setTipologiaSelezionataId] = useState("");
  const [medicoSelezionatoId, setMedicoSelezionatoId] = useState("");
  const { utente, isPaziente, isMedico, isAdmin } = useUtente();
  const [idDaEliminare, setIdDaEliminare] = useState<string | null>(null);
  const [azioneConferma, setAzioneConferma] = useState<(() => void) | null>(null);

  function calcoloTitoloCalendario() {
    if (tipoLista === "Medici" && isAdmin && isNuovaPrenotazioneAdmin === false) {
      return `del Dr. ${utenteSelezionato?.nome} ${utenteSelezionato?.cognome}`;
    } else if (isAdmin && isNuovaPrenotazioneAdmin) {
      const pazienteSelezionato = tuttiPazienti?.find((x) => x.id === Number(pazienteSelezionatoId));
      if (pazienteSelezionato) return `di ${pazienteSelezionato?.nome} ${pazienteSelezionato?.cognome}`;
      else return "";
    } else return `di ${utenteSelezionato?.nome} ${utenteSelezionato?.cognome}`;
  }
  const titoloCalendario = calcoloTitoloCalendario();

  const COLORI_PAZIENTE: Record<string, string> = { mio: "bg-success", prenotabile: "bg-info", pieno: "bg-light" };
  const COLORI_MEDICO: Record<string, string> = { prenotato: "bg-success", prenotabile: "bg-info", na: "bg-light" };

  function gestioneCelle(giorno: Date, ora: number) {
    let controlloCella: string;
    let mappaColori: Record<string, string>;
    if (isPaziente || (isAdmin && tipoLista === "Pazienti") || (isAdmin && isNuovaPrenotazioneAdmin)) {
      controlloCella = statoCellaPaziente(giorno, ora);
      mappaColori = COLORI_PAZIENTE;
    } else {
      // isMedico, oppure isAdmin sui Medici
      controlloCella = statoCellaMedico(giorno, ora);
      mappaColori = COLORI_MEDICO;
    }
    return { controlloCella, coloreCella: mappaColori[controlloCella] };
  }

  function datiAzioneCella(giorno: Date, ora: number, giornoDisponibile: boolean, controlloCella: string) {
    if (isPaziente || (isAdmin && tipoLista === "Pazienti") || (isAdmin && isNuovaPrenotazioneAdmin)) return azioneLatoPaziente(giorno, ora, giornoDisponibile, controlloCella);
    return azioneLatoMedico(giorno, ora, controlloCella);
  }

  function azioneLatoPaziente(giorno: Date, ora: number, giornoDisponibile: boolean, controlloCella: string) {
    if (giornoDisponibile && controlloCella === "prenotabile") return { titolo: "Clicca per prenotare", azione: () => onPrenota(giorno, ora, tipologiaSelezionataId, medicoSelezionatoId) };
    if (giornoDisponibile && controlloCella === "mio")
      return { titolo: "Clicca per disdire", azione: () => setAzioneConferma(() => () => onDisdici(giorno, ora, tipologiaSelezionataId, medicoSelezionatoId)) };
    return { titolo: "", azione: undefined };
  }

  function azioneLatoMedico(giorno: Date, ora: number, controlloCella: string) {
    if (controlloCella === "prenotabile") return { titolo: "Clicca per rimuovere disponibilità", azione: () => onClickCasella(giorno, ora) };
    if (controlloCella === "prenotato") return { titolo: "Clicca per disdire", azione: () => setAzioneConferma(() => () => onDisdici(giorno, ora, tipologiaSelezionataId)) };
    if (controlloCella === "na") return { titolo: "Clicca per dare disponibilità", azione: () => onClickCasella(giorno, ora) };
    return { titolo: "", azione: undefined };
  }

  function formattaData(dataIso: string) {
    const d = new Date(dataIso);
    return {
      giorno: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }),
      ora: d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  function suddividiMedici() {
    const fonte = sezionePrenotazioni === "nuovaPrenotazioneAdmin" && tipologiaSelezionataId === "" ? tuttiMedici : mediciTipologia;
    return [...new Map(fonte?.map((d) => [d.medicoId, d])).values()];
  }

  function calcolaControparte() 
  {
    if(isPaziente || (isAdmin && tipoLista === "Pazienti")) return "Medico"
    else return "Paziente"
  }
  const controparte = calcolaControparte();

    function calcolaControparteValore() 
  {
    if(isPaziente || (isAdmin && tipoLista === "Pazienti")) return "Medico"
    else return "Paziente"
  }
  const controparteValore = calcolaControparteValore();

  return (
    <div className={styles.prenotazioniContainer}>
      <div className="row">
        <div className="container">
          {sezionePrenotazioni === "nuovaPrenotazioneCalendario" && (
            <div className={`p-3  ${stylesShared.cardBorder}`}>
              <div className={`card ${styles.projectListTableColor}`}>
                <div className={`card-header text-white ${styles.titleMedisport}`}>
                  <div className="row">
                    <div className="col-6">
                      {isAdmin && !isNuovaPrenotazioneAdmin && <h5 className="m-2">Calendario {titoloCalendario}</h5>}
                      {(!isAdmin || (isAdmin && isNuovaPrenotazioneAdmin)) && <h5 className="m-2">Calendario prenotazioni</h5>}
                    </div>
                    <div className="col-6 d-flex justify-content-end">
                      {(isMedico || (isAdmin && tipoLista === "Medici")) && (
                        <button className="btn btn-success me-3" onClick={() => setMostraFormFasciaDisponibilita((v) => !v)}>
                          <i className="bi-plus-lg"></i> Fascia oraria
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          setTipologiaSelezionataId("");
                          setMedicoSelezionatoId("");
                          onMostraPrenotazioni(idUtente);
                        }}
                      >
                        Indietro <i className="bi-box-arrow-left"></i>
                      </button>
                      {mostraFormFasciaDisponibilita && (
                        <div className={`${styles.pannelloDisponibilita} me-4`}>
                          <div className={`d-flex gap-3 align-items-end p-3 ${stylesShared.cardBorder}`}>
                            <div>
                              <label htmlFor="selGiorno" className="form-label text-muted">
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
                              <label htmlFor="selOraInizio" className="form-label text-muted">
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
                              <label htmlFor="selOraFine" className="form-label text-muted">
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
                      <div className="d-flex align-items-center gap-4 px-3 py-2">
                        {!isPaziente && !isNuovaPrenotazioneAdmin && tipoLista === "Medici" && (
                          <>
                            <span className="text-muted">Clicca su una casella per aggiungere o rimuovere la disponibilità</span>
                            <span className="d-flex align-items-center gap-2">
                              <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-light`}></span>
                              <span> Libera</span>
                            </span>
                          </>
                        )}
                        {(isPaziente || (isAdmin && isNuovaPrenotazioneAdmin) || tipoLista === "Pazienti") && (
                          <span className="text-muted">Clicca su una casella per confermare/disdire la prenotazione:</span>
                        )}
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-info`}></span>
                          <span>Disponibile </span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-success`}></span>
                          <span> Visita confermata</span>
                        </span>
                      </div>
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
                              {giorniSettimana.map((giorno) => {
                                const giornoDisponibile = isGiornoDisponibile(giorno, ora);
                                const { coloreCella, controlloCella } = gestioneCelle(giorno, ora);
                                const { titolo, azione } = datiAzioneCella(giorno, ora, giornoDisponibile, controlloCella);
                                return <td title={titolo} key={giorno.toISOString()} className={`${styles.cellStyle} ${coloreCella} ${azione ? styles.cellStylePointer : ""}`} onClick={azione}></td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <button className="btn btn-success rounded-pill px-4 " onClick={onSettimanaPrecedente}>
                    <i className="bi bi-chevron-left"></i> Settimana precedente
                  </button>
                  <button className="btn btn-success rounded-pill px-4 " onClick={onSettimanaSuccessiva}>
                    Settimana successiva <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
          {sezionePrenotazioni === "visualizzaPrenotazioni" && (
            <div className="row">
              <div className="col-8">
                <div className={`p-3 ${stylesShared.cardBorder}`}>
                  <div className={`card ${styles.projectListTableColor}`}>
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      <div className="row">
                        <div className="col">
                          {isAdmin && <h5 className="m-2">Prenotazioni confermate {titoloCalendario}</h5>}
                          {!isAdmin && <h5 className="m-2">Prenotazioni confermate</h5>}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="table-responsive">
                          {/* <TabellaAppuntamenti intestazioneControparte={controparte} appuntamenti={appuntamenti} onCancella={(id) => setAzioneConferma(() => () => onDisdiciById(id.toString()))} valoreControparte={controparteValore}></TabellaAppuntamenti> */}
                          <table className={`table ${styles.projectListTable} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
                            <thead>
                              <tr>
                                <th scope="col" className={`${styles.w20} ps-4`}>
                                  Tipologia Visita
                                </th>
                                {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && (
                                  <th className={`${styles.w20}`} scope="col">
                                    Medico
                                  </th>
                                )}
                                {(isMedico || (isAdmin && tipoLista === "Medici")) && (
                                  <th className={`${styles.w20}`} scope="col">
                                    Paziente
                                  </th>
                                )}
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
                              {appuntamenti
                                ?.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                                .map((appuntamento) => {
                                  const { giorno, ora } = formattaData(appuntamento.data);
                                  return (
                                    <tr key={appuntamento.id}>
                                      <td className="ps-4">{appuntamento.tipologiaVisita}</td>
                                      {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && <td>{`${appuntamento.medicoNome} ${appuntamento.medicoCognome}`}</td>}
                                      {(isMedico || (isAdmin && tipoLista === "Medici")) && <td>{`${appuntamento.pazienteNome} ${appuntamento.pazienteCognome}`}</td>}
                                      <td>{giorno}</td>
                                      <td>{ora}</td>
                                      <td>
                                        <ul className="list-inline m-0">
                                          <li className="list-inline-item position-relative">
                                            <button className={`btn px-2 text-danger`} title="Cancella" onClick={() => setAzioneConferma(() => () => onDisdiciById(appuntamento.id.toString()))}>
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-4">
                <div className={`p-3 ${stylesShared.cardBorder}`}>
                  <div className="card">
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && <h5 className="m-2">Prenota nuova visita</h5>}
                      {(isMedico || (isAdmin && tipoLista === "Medici")) && <h5 className="m-2">Gestisci disponibilità</h5>}
                    </div>
                    {(isPaziente || (isAdmin && tipoLista === "Pazienti")) && (
                      <div className="container">
                        <div className="row p-3">
                          <label htmlFor="selGiorno" className="form-label text-muted">
                            Seleziona la tipologia di servizio
                          </label>
                          <select
                            id="selTipologia"
                            className="form-select"
                            value={tipologiaSelezionataId}
                            onChange={async (e) => {
                              const id = e.target.value;
                              setTipologiaSelezionataId(id);
                              setMedicoSelezionatoId("");
                              onCaricaMediciPerTipologia(id);
                            }}
                          >
                            <option value="" disabled hidden>
                              Servizi
                            </option>
                            {tipologiaVisite?.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.descrizione}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="row p-3">
                          <label htmlFor="selGiorno" className="form-label text-muted">
                            Preferisci un professionista?
                          </label>
                          <select
                            disabled={tipologiaSelezionataId === "" || !mediciTipologia || mediciTipologia.length === 0}
                            id="selOperatore"
                            className="form-select"
                            value={medicoSelezionatoId}
                            onChange={(e) => {
                              setMedicoSelezionatoId(e.target.value);
                            }}
                          >
                            <option value="">Tutti gli operatori</option>
                            {suddividiMedici().map((m) => (
                              <option key={m.medicoId} value={m.medicoId}>
                                {m.medicoNome} {m.medicoCognome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="row p-3">
                          {suddividiMedici().length === 0 && (
                            <label htmlFor="selGiorno" className="form-label text-muted">
                              Nessun medico disponibile
                            </label>
                          )}
                          <button
                            disabled={tipologiaSelezionataId === "" || !mediciTipologia || mediciTipologia.length === 0}
                            className="btn btn-success rounded-pill px-4 fw-bold"
                            onClick={async () => {
                              if (medicoSelezionatoId === "") {
                                await Promise.all([onCaricaDisponibilitaPerTipologia(tipologiaSelezionataId), onCaricaAppuntamentoPerTipologia(tipologiaSelezionataId)]);
                              } else {
                                await Promise.all([onCaricaDisponibilitaPerMedico(medicoSelezionatoId), onCaricaAppuntamentoPerMedico(medicoSelezionatoId)]);
                              }
                              setSezionePrenotazioni("nuovaPrenotazioneCalendario");
                            }}
                          >
                            PRENOTA
                          </button>
                        </div>
                      </div>
                    )}
                    {(isMedico || (isAdmin && tipoLista === "Medici")) && (
                      <div className="row p-3">
                        <label htmlFor="selGiorno" className="form-label text-muted">
                          Aggiungi/rimuovi i giorni e le ore di disponibilità
                        </label>
                        <button
                          className="btn btn-success rounded-pill px-4 fw-bold"
                          onClick={() => {
                            setSezionePrenotazioni("nuovaPrenotazioneCalendario");
                          }}
                        >
                          CONTINUA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {sezionePrenotazioni === "nuovaPrenotazioneAdmin" && (
            <div className="row ">
              <div className="col-4">
                <div className={`p-3 ${stylesShared.cardBorder}`}>
                  <div className="card">
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      <h5 className="m-2">Prenota nuova visita</h5>
                    </div>
                    <div className="container">
                      <div className="row p-3">
                        <label htmlFor="selGiorno" className="form-label text-muted">
                          Paziente
                        </label>
                        <select
                          disabled={tipologiaSelezionataId !== "" && (!mediciTipologia || mediciTipologia.length === 0)}
                          id="selPaziente"
                          className="form-select"
                          value={pazienteSelezionatoId}
                          onChange={(e) => {
                            setPazienteSelezionatoId(e.target.value);
                            onMostraPrenotazioni(e.target.value);
                          }}
                        >
                          <option value="" disabled hidden>
                            Tutti i pazienti
                          </option>
                          {tuttiPazienti?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} {p.cognome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="row p-3">
                        <label htmlFor="selGiorno" className="form-label text-muted">
                          Seleziona la tipologia di servizio
                        </label>
                        <select
                          id="selTipologia"
                          className="form-select"
                          value={tipologiaSelezionataId}
                          onChange={async (e) => {
                            const id = e.target.value;
                            setTipologiaSelezionataId(id);
                            setMedicoSelezionatoId("");
                            if (Number(id) > 0) {
                              onCaricaMediciPerTipologia(id);
                            }
                          }}
                        >
                          <option value="">Tutti i servizi</option>
                          {tipologiaVisite?.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.descrizione}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="row p-3">
                        <label htmlFor="selGiorno" className="form-label text-muted">
                          Professionista
                        </label>
                        <select
                          disabled={tipologiaSelezionataId !== "" && (!mediciTipologia || mediciTipologia.length === 0)}
                          id="selOperatore"
                          className="form-select"
                          value={medicoSelezionatoId}
                          onChange={(e) => {
                            setMedicoSelezionatoId(e.target.value);
                          }}
                        >
                          <option value="" hidden={tipologiaSelezionataId === ""}>
                            Tutti gli operatori
                          </option>
                          {suddividiMedici().map((m) => (
                            <option key={m.medicoId} value={m.medicoId}>
                              {m.medicoNome} {m.medicoCognome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="row p-3">
                        {suddividiMedici()?.length === 0 && (
                          <label htmlFor="selGiorno" className="form-label text-muted">
                            Nessun medico disponibile
                          </label>
                        )}
                        <button
                          disabled={
                            (tipologiaSelezionataId !== "" && (!mediciTipologia || mediciTipologia.length === 0)) ||
                            (tipologiaSelezionataId === "" && medicoSelezionatoId === "") ||
                            pazienteSelezionatoId === ""
                          }
                          className="btn btn-success rounded-pill px-4 fw-bold"
                          onClick={async () => {
                            if (medicoSelezionatoId === "") {
                              await Promise.all([onCaricaDisponibilitaPerTipologia(tipologiaSelezionataId), onCaricaAppuntamentoPerTipologia(tipologiaSelezionataId)]);
                            } else {
                              await Promise.all([onCaricaDisponibilitaPerMedico(medicoSelezionatoId), onCaricaAppuntamentoPerMedico(medicoSelezionatoId)]);
                            }
                            setSezionePrenotazioni("nuovaPrenotazioneCalendario");
                          }}
                        >
                          PRENOTA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-8">
                <div className={`p-3 ${stylesShared.cardBorder}`}>
                  <div className={`card ${styles.projectListTableColor}`}>
                    <div className={`card-header text-white ${styles.titleMedisport}`}>
                      <div className="row">
                        <div className="col-6">
                          <h5 className="m-2">Prenotazioni confermate {calcoloTitoloCalendario()}</h5>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="table-responsive">
                          <table className={`table ${styles.projectListTable} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
                            <thead>
                              <tr>
                                <th scope="col" className={`${styles.w20} ps-4`}>
                                  Tipologia Visita
                                </th>
                                <th className={`${styles.w20}`} scope="col">
                                  Medico
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
                              {appuntamenti
                                ?.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                                .map((appuntamento) => {
                                  const { giorno, ora } = formattaData(appuntamento.data);
                                  return (
                                    <tr key={appuntamento.id}>
                                      <td className="ps-4">{appuntamento.tipologiaVisita}</td>
                                      <td>{`${appuntamento.medicoNome} ${appuntamento.medicoCognome}`}</td>
                                      <td>{giorno}</td>
                                      <td>{ora}</td>
                                      <td>
                                        <ul className="list-inline m-0">
                                          <li className="list-inline-item position-relative">
                                            <button className={`btn px-2 text-danger`} title="Cancella" onClick={() => setAzioneConferma(() => () => onDisdiciById(appuntamento.id.toString()))}>
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfermaEliminazione
        mostra={azioneConferma !== null}
        messaggio="Disdire la prenotazione?"
        onConferma={() => {
          azioneConferma?.();
          setAzioneConferma(null);
        }}
        onAnnulla={() => setAzioneConferma(null)}
      />
    </div>
  );
}

export default Prenotazioni;
