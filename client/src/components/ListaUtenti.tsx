import styles from "../pages/AreaPersonale.module.css";
import stylesShared from "../shared.module.css";
import { useState } from "react";
import { SESSO_LABELS } from "../constants";
import ConfermaEliminazione from "./ConfermaEliminazione";
import type { User } from "../types";

function ListaUtenti({
  tipoLista,
  totaleUsers,
  onNuovo,
  tipologiaServizio,
  usersPagina,
  onModificaInLista,
  onCancella,
  inizioPaginaUtenti,
  USERS_PER_PAGINA,
  indicePagina,
  onCambiaPagina,
  totalePagineUtenti,
  onVisualizzaPrenotazione,
}: Readonly<{
  tipoLista: string;
  totaleUsers: number;
  onNuovo?: () => void;
  tipologiaServizio?: boolean;
  usersPagina: User[] | undefined;
  onModificaInLista?: (user: User) => void;
  onCancella: (idUtente: string) => void;
  inizioPaginaUtenti: number;
  USERS_PER_PAGINA: number;
  indicePagina: number;
  onCambiaPagina: (numeroPagina: number) => void;
  totalePagineUtenti: number;
  onVisualizzaPrenotazione: (utenteSelezionato: User) => void;
}>) {
  const [azioneConferma, setAzioneConferma] = useState<(() => void) | null>(null);

  return (
    <div className="row g-0">
      <div className={`p-3  ${stylesShared.cardBorder}`}>
        <div className={`card ${styles.projectListTableColor}`}>
          <div className={`card-header text-white ${styles.titleMedisport}`}>
            <div className="row">
              <div className="col-6">
                <h5 className="m-2">
                  Lista {tipoLista} ({totaleUsers})
                </h5>
              </div>
              <div className="col-6 d-flex justify-content-end">
                {onNuovo && (
                  <button className="btn btn-success" onClick={onNuovo}>
                    <i className="bi-plus-lg"></i> Nuovo
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <div className="">
                <div className="table-responsive">
                  <table className={`table ${styles.projectListTable} ${styles.projectListTableColor} align-middle table-borderless m-0 `}>
                    <thead>
                      <tr>
                        <th scope="col" className={`${styles.w15} ps-4`}>
                          Nome
                        </th>
                        <th className={`${styles.w15}`} scope="col">
                          Cognome
                        </th>
                        {tipologiaServizio && (
                          <th className={`${styles.w15}`} scope="col">
                            Servizi
                          </th>
                        )}
                        <th className={`${styles.w15}`} scope="col">
                          Data di Nascita
                        </th>
                        <th className={`${styles.w15}`} scope="col">
                          Sesso
                        </th>
                        <th className={`${styles.w15}`} scope="col">
                          Codice Fiscale
                        </th>
                        <th className={`${styles.w10}`} scope="col">
                          Gestione
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersPagina?.map((user) => (
                        <tr key={user.id}>
                          <td className="ps-4">{user.nome}</td>
                          <td>{user.cognome}</td>
                          {tipologiaServizio && <td>{user.tipologiaVisite?.[0]?.descrizione ?? "N/A"}</td>}
                          <td>
                            {new Date(user.dataNascita).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                          <td>{SESSO_LABELS[user.sesso]}</td>
                          <td>{user.codiceFiscale ?? "N/A"}</td>
                          <td>
                            <ul className="list-inline m-0">
                              {onModificaInLista && (
                                <li className="list-inline-item">
                                  <button className="btn px-2 text-primary" title="Modifica" onClick={() => onModificaInLista(user)}>
                                    <i className="bi bi-pencil font-size-18"></i>
                                  </button>
                                </li>
                              )}
                              <li className="list-inline-item">
                                <button className="btn px-2 text-success" title="Prenotazioni attive" onClick={() => onVisualizzaPrenotazione(user)}>
                                  <i className="bi-calendar-check"></i>
                                </button>
                              </li>
                              <li className="list-inline-item position-relative">
                                <button className={`btn px-2 text-danger`} title="Cancella" onClick={() => setAzioneConferma(() => () => onCancella(user.id.toString()))}>
                                  <i className="bi bi-trash font-size-18"></i>
                                </button>
                              </li>
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 row g-0 align-items-center pb-4">
            <div className="col-sm-6">
              <div>
                <p className="mb-sm-0">
                  Mostrando {totaleUsers === 0 ? 0 : inizioPaginaUtenti + 1} a {Math.min(inizioPaginaUtenti + USERS_PER_PAGINA, totaleUsers)} di {totaleUsers} totali
                </p>
              </div>
            </div>
            <div className="col-sm-6 me-0">
              <div className="float-sm-end">
                <ul className="pagination mb-sm-0">
                  <li className={`page-item ${indicePagina <= 1 ? "disabled" : ""}`}>
                    <button className="btn page-link" onClick={() => onCambiaPagina(indicePagina - 1)} disabled={indicePagina <= 1}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li className="page-item">
                    <div className="btn-toolbar" role="toolbar">
                      <div className="btn-group">
                        {Array.from({ length: totalePagineUtenti }, (_, indice) => (
                          <button key={indice} className={`btn btn-primary ${indicePagina === indice + 1 ? "active" : ""}`} onClick={() => onCambiaPagina(indice + 1)}>
                            {indice + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                  <li className={`page-item ${indicePagina >= totalePagineUtenti ? "disabled" : ""}`}>
                    <button className="btn page-link" onClick={() => onCambiaPagina(indicePagina + 1)} disabled={indicePagina >= totalePagineUtenti}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfermaEliminazione
        mostra={azioneConferma !== null}
        messaggio="Eliminare anagrafica utente?"
        onConferma={() => {
          azioneConferma?.(); // esegue l'azione salvata, qualunque sia
          setAzioneConferma(null);
        }}
        onAnnulla={() => setAzioneConferma(null)}
      />
    </div>
  );
}

export default ListaUtenti;
