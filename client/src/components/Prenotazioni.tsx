import styles from "../styles/areaPersonale.module.css";
import stylesShared from "../styles/shared.module.css";
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
  onCaricaCalendarioPerMedico,
  onCaricaCalendarioPerTipologia,
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
  onPrenota: (giorno: Date, ora: number, tipologiaSelezionataId?: string, medicoSelezionatoId?: string) => void;
  onDisdici: (giorno: Date, ora: number, tipologiaSelezionataId?: string, medicoSelezionatoId?: string) => void;
  onDisdiciById: (tipologiaSelezionataId: string) => void;
  onCaricaCalendarioPerMedico: (id: string) => Promise<void>;
  onCaricaCalendarioPerTipologia: (id: string) => Promise<void>;
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
  const { isPaziente, isMedico, isAdmin } = useUtente();
  const [azioneConferma, setAzioneConferma] = useState<(() => void) | null>(null);

  const latoPaziente = isPaziente || (isAdmin && (tipoLista === "Pazienti" || isNuovaPrenotazioneAdmin));
  const latoMedico = isMedico || (isAdmin && tipoLista === "Medici");

  function calcoloTitoloCalendario() {
    if (latoMedico) return `del Dr. ${utenteSelezionato?.nome} ${utenteSelezionato?.cognome}`;
    else if (isNuovaPrenotazioneAdmin) {
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
    if (latoPaziente) {
      controlloCella = statoCellaPaziente(giorno, ora);
      mappaColori = COLORI_PAZIENTE;
    } else {
      // isMedico, oppure isAdmin sui Medici
      controlloCella = statoCellaMedico(giorno, ora);
      mappaColori = COLORI_MEDICO;
    }
    return { controlloCella, coloreCella: mappaColori[controlloCella] };
  }

  function azioneSuCella(giorno: Date, ora: number, giornoDisponibile: boolean, controlloCella: string) {
    if (latoPaziente) return azioneSuCellaLatoPaziente(giorno, ora, giornoDisponibile, controlloCella);
    return azioneSuCellaLatoMedico(giorno, ora, controlloCella);
  }

  function azioneSuCellaLatoPaziente(giorno: Date, ora: number, giornoDisponibile: boolean, controlloCella: string) {
    if (giornoDisponibile && controlloCella === "prenotabile") return { titolo: "Clicca per prenotare", azione: () => onPrenota(giorno, ora, tipologiaSelezionataId, medicoSelezionatoId) };
    if (giornoDisponibile && controlloCella === "mio")
      return { titolo: "Clicca per disdire", azione: () => setAzioneConferma(() => () => onDisdici(giorno, ora, tipologiaSelezionataId, medicoSelezionatoId)) };
    return { titolo: "", azione: undefined };
  }

  function azioneSuCellaLatoMedico(giorno: Date, ora: number, controlloCella: string) {
    if (controlloCella === "prenotabile") return { titolo: "Clicca per rimuovere disponibilità", azione: () => onClickCasella(giorno, ora) };
    if (controlloCella === "prenotato") return { titolo: "Clicca per disdire", azione: () => setAzioneConferma(() => () => onDisdici(giorno, ora, tipologiaSelezionataId)) };
    if (controlloCella === "na") return { titolo: "Clicca per dare disponibilità", azione: () => onClickCasella(giorno, ora) };
    return { titolo: "", azione: undefined };
  }

  function suddividiMedici() {
    //se siamo in "nuovaPrenotazioneAdmin" e non si è selezionato la tipologia, restituisce tutti i medici, altrimenti restituisce quelli di quella tipologia
    const fonte = sezionePrenotazioni === "nuovaPrenotazioneAdmin" && tipologiaSelezionataId === "" ? tuttiMedici : mediciTipologia;
    return [...new Map(fonte?.map((d) => [d.medicoId, d])).values()];
  }
  const mediciUnici = suddividiMedici();

  async function inviaNuovaPrenotazione() {
    if (medicoSelezionatoId === "") {
      await Promise.all([onCaricaDisponibilitaPerTipologia(tipologiaSelezionataId), onCaricaCalendarioPerTipologia(tipologiaSelezionataId)]);
    } else {
      await Promise.all([onCaricaDisponibilitaPerMedico(medicoSelezionatoId), onCaricaCalendarioPerMedico(medicoSelezionatoId)]);
    }
    setSezionePrenotazioni("nuovaPrenotazioneCalendario");
  }

  async function onSelezionaTipologia(id: string) {
    setTipologiaSelezionataId(id);
    setMedicoSelezionatoId("");
    if (Number(id) > 0) {
      await onCaricaMediciPerTipologia(id);
    }
  }
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
                      {isAdmin && <h5 className="m-2">Calendario {titoloCalendario}</h5>}
                      {!isAdmin && <h5 className="m-2">Calendario prenotazioni personali</h5>}
                    </div>
                    <div className="col-6 d-flex justify-content-end">
                      {latoMedico && (
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
                          <div className={`d-flex flex-wrap gap-3 align-items-end p-3 ${stylesShared.cardBorder}`}>
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
                        {latoMedico && (
                          <>
                            <span className="text-muted">Clicca su una casella per aggiungere o rimuovere la disponibilità</span>
                            <span className="d-flex align-items-center gap-2">
                              <span className={`${styles.tabellaPrenotazioniLegenda} d-inline-block rounded bg-light`}></span>
                              <span> Libera</span>
                            </span>
                          </>
                        )}
                        {latoPaziente && <span className="text-muted">Clicca su una casella per confermare/disdire la prenotazione:</span>}
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
                                const { titolo, azione } = azioneSuCella(giorno, ora, giornoDisponibile, controlloCella);
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
              <PannelloPrenotazioniConfermate
                larghezza="col-lg-8"
                isAdmin={isAdmin}
                titoloCalendario={titoloCalendario}
                controparte={latoPaziente ? "Medico" : "Paziente"}
                appuntamenti={appuntamenti}
                onCancella={(id) => setAzioneConferma(() => () => onDisdiciById(id.toString()))}
              ></PannelloPrenotazioniConfermate>
              <PannelloFormPrenotazione
                latoMedico={latoMedico}
                latoPaziente={latoPaziente}
                isNuovaPrenotazione={isNuovaPrenotazioneAdmin}
                mediciTipologia={mediciTipologia}
                mediciUnici={mediciUnici}
                medicoSelezionatoId={medicoSelezionatoId}
                tipologiaVisite={tipologiaVisite}
                tuttiPazienti={tuttiPazienti}
                tipologiaSelezionataId={tipologiaSelezionataId}
                pazienteSelezionatoId={pazienteSelezionatoId}
                onInviaNuovaDisponibilita={() => setSezionePrenotazioni("nuovaPrenotazioneCalendario")}
                onInviaNuovaPrenotazione={inviaNuovaPrenotazione}
                onSelezionaPaziente={(id) => {
                  setPazienteSelezionatoId(id);
                  onMostraPrenotazioni(id);
                }}
                onSelezionaMedico={(id) => {
                  setMedicoSelezionatoId(id);
                }}
                onSelezionaTipologia={onSelezionaTipologia}
              ></PannelloFormPrenotazione>
            </div>
          )}
          {sezionePrenotazioni === "nuovaPrenotazioneAdmin" && (
            <div className="row ">
              <PannelloFormPrenotazione
                latoMedico={latoMedico}
                latoPaziente={latoPaziente}
                isNuovaPrenotazione={isNuovaPrenotazioneAdmin}
                mediciTipologia={mediciTipologia}
                mediciUnici={mediciUnici}
                medicoSelezionatoId={medicoSelezionatoId}
                tipologiaVisite={tipologiaVisite}
                tuttiPazienti={tuttiPazienti}
                tipologiaSelezionataId={tipologiaSelezionataId}
                pazienteSelezionatoId={pazienteSelezionatoId}
                onInviaNuovaPrenotazione={inviaNuovaPrenotazione}
                onSelezionaPaziente={(id) => {
                  setPazienteSelezionatoId(id);
                  onMostraPrenotazioni(id);
                }}
                onSelezionaMedico={(id) => {
                  setMedicoSelezionatoId(id);
                }}
                onSelezionaTipologia={onSelezionaTipologia}
              ></PannelloFormPrenotazione>

              <PannelloPrenotazioniConfermate
                larghezza="col-lg-8"
                isAdmin={isAdmin}
                titoloCalendario={titoloCalendario}
                controparte={latoPaziente ? "Medico" : "Paziente"}
                appuntamenti={appuntamenti}
                onCancella={(id) => setAzioneConferma(() => () => onDisdiciById(id.toString()))}
              ></PannelloPrenotazioniConfermate>
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
function PannelloPrenotazioniConfermate({
  larghezza,
  isAdmin,
  titoloCalendario,
  controparte,
  appuntamenti,
  onCancella,
}: Readonly<{ larghezza: string; isAdmin: boolean; titoloCalendario: string; controparte: string; appuntamenti: Appuntamento[] | null; onCancella: (id: number) => void }>) {
  return (
    <div className={`col-12 ${larghezza} mb-4 mb-lg-0`}>
      <div className={`p-3 ${stylesShared.cardBorder}`}>
        <div className={`card ${styles.projectListTableColor}`}>
          <div className={`card-header text-white ${styles.titleMedisport}`}>
            <div className="row">
              <div className="col">
                <h5 className="m-2">Prenotazioni confermate {isAdmin ? titoloCalendario : ""}</h5>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <div className="table-responsive">
                <TabellaAppuntamenti
                  intestazioneControparte={controparte}
                  appuntamenti={appuntamenti}
                  onCancella={onCancella}
                  valoreControparte={controparte === "Medico" ? (a) => `${a.medicoNome} ${a.medicoCognome}` : (a) => `${a.pazienteNome} ${a.pazienteCognome}`}
                ></TabellaAppuntamenti>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PannelloFormPrenotazione({
  isNuovaPrenotazione,
  latoPaziente,
  latoMedico,
  tipologiaSelezionataId,
  mediciTipologia,
  pazienteSelezionatoId,
  onSelezionaPaziente,
  onSelezionaMedico,
  onSelezionaTipologia,
  mediciUnici,
  tuttiPazienti,
  tipologiaVisite,
  medicoSelezionatoId,
  onInviaNuovaPrenotazione,
  onInviaNuovaDisponibilita,
}: Readonly<{
  isNuovaPrenotazione: boolean;
  latoPaziente: boolean;
  latoMedico: boolean;
  tipologiaSelezionataId: string | null;
  mediciTipologia: DisponibilitaMedico[] | null;
  pazienteSelezionatoId: string | null;
  onSelezionaPaziente: (id: string) => void;
  onSelezionaMedico: (id: string) => void;
  onSelezionaTipologia: (id: string) => void;
  mediciUnici: DisponibilitaMedico[];
  tuttiPazienti: User[] | null;
  tipologiaVisite: TipologiaVisita[] | null;
  medicoSelezionatoId: string | null;
  onInviaNuovaPrenotazione: () => void;
  onInviaNuovaDisponibilita?: () => void;
}>) {
  function logicaDisabledSelect() {
    if (isNuovaPrenotazione) return tipologiaSelezionataId !== "" && (!mediciTipologia || mediciTipologia.length === 0);
    else return tipologiaSelezionataId === "" || !mediciTipologia || mediciTipologia.length === 0;
  }
  const selectDisabilitato = logicaDisabledSelect();

  function logicaDisabledButton() {
    if (isNuovaPrenotazione)
      return (tipologiaSelezionataId !== "" && (!mediciTipologia || mediciTipologia.length === 0)) || (tipologiaSelezionataId === "" && medicoSelezionatoId === "") || pazienteSelezionatoId === "";
    else return selectDisabilitato;
  }
  const buttonDisabilitato = logicaDisabledButton();

  return (
    <div className="col-12 col-lg-4 mb-4 mb-lg-0">
      <div className={`p-3 ${stylesShared.cardBorder}`}>
        <div className={`card ${styles.projectListTableColor}`}>
          <div className={`card-header text-white ${styles.titleMedisport}`}>
            {latoPaziente && <h5 className="m-2">Prenota nuova visita</h5>}
            {latoMedico && <h5 className="m-2">Gestisci disponibilità</h5>}
          </div>
          <div className="container">
            {isNuovaPrenotazione && (
              <div className="row p-3">
                <label htmlFor="selPaziente" className="form-label text-muted">
                  Paziente
                </label>
                <select
                  disabled={selectDisabilitato}
                  id="selPaziente"
                  className="form-select"
                  value={pazienteSelezionatoId ?? ""}
                  onChange={(e) => {
                    onSelezionaPaziente(e.target.value);
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
            )}
            {latoPaziente && (
              <>
                <div className="row p-3">
                  <label htmlFor="selTipologiaNuovaPrenotazioneAdmin" className="form-label text-muted">
                    Seleziona la tipologia di servizio
                  </label>
                  <select
                    id="selTipologiaNuovaPrenotazioneAdmin"
                    className="form-select"
                    value={tipologiaSelezionataId ?? ""}
                    onChange={(e) => {
                      onSelezionaTipologia(e.target.value);
                    }}
                  >
                    {isNuovaPrenotazione && <option value="">Tutti i servizi</option>}
                    {!isNuovaPrenotazione && (
                      <option value="" disabled hidden>
                        Servizi
                      </option>
                    )}

                    {tipologiaVisite?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.descrizione}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row p-3">
                  <label htmlFor="selOperatoreNuovaPrenotazioneAdmin" className="form-label text-muted">
                    {isNuovaPrenotazione ? "Professionista" : "Preferisci un professionista?"}
                  </label>
                  <select
                    disabled={selectDisabilitato}
                    id="selOperatoreNuovaPrenotazioneAdmin"
                    className="form-select"
                    value={medicoSelezionatoId ?? ""}
                    onChange={(e) => {
                      onSelezionaMedico(e.target.value);
                    }}
                  >
                    <option value="" hidden={isNuovaPrenotazione && tipologiaSelezionataId === ""}>
                      Tutti gli operatori
                    </option>
                    {mediciUnici.map((m) => (
                      <option key={m.medicoId} value={m.medicoId}>
                        {m.medicoNome} {m.medicoCognome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row p-3">
                  {mediciUnici.length === 0 && (
                    <label htmlFor="btnInviaNuovaPrenotazioneCalendario" className="form-label text-muted">
                      Nessun medico disponibile
                    </label>
                  )}
                  <button id="btnInviaNuovaPrenotazioneCalendario" disabled={buttonDisabilitato} className="btn btn-success rounded-pill px-4 fw-bold" onClick={onInviaNuovaPrenotazione}>
                    PRENOTA
                  </button>
                </div>
              </>
            )}
            {latoMedico && (
              <div className="row p-3">
                <label htmlFor="btnInviaNuovaPrenotazioneCalendario" className="form-label text-muted">
                  Aggiungi/rimuovi i giorni e le ore di disponibilità
                </label>
                <button id="btnInviaNuovaPrenotazioneCalendario" className="btn btn-success rounded-pill px-4 fw-bold" onClick={onInviaNuovaDisponibilita}>
                  CONTINUA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Prenotazioni;
