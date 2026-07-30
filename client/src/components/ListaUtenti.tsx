import styles from "../styles/areaPersonale.module.css";
import stylesShared from "../styles/shared.module.css";
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
                  <table className={`table align-middle table-borderless m-0 ${styles.projectListTable} ${styles.projectListTableColor} ${styles.cardTable}`}>
                    <thead>
                      <tr>
                        <th scope="col" className={`${styles.w15} ps-lg-4`}>
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
                          <td className="ps-lg-4" data-label="Nome">
                            {user.nome}
                          </td>
                          <td data-label="Cognome">{user.cognome}</td>
                          {tipologiaServizio && <td data-label="Servizi">{user.tipologiaVisite?.[0]?.descrizione ?? "N/A"}</td>}
                          <td data-label="Data di Nascita">
                            {new Date(user.dataNascita).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                          <td data-label="Sesso">{SESSO_LABELS[user.sesso]}</td>
                          <td data-label="Codice Fiscale">{user.codiceFiscale ?? "N/A"}</td>
                          <td data-label="Gestione">
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
        messaggio={`Eliminare anagrafica utente? \n N.B: Verranno eliminati anche i suoi appuntamenti`}
        onConferma={() => {
          azioneConferma?.();
          setAzioneConferma(null);
        }}
        onAnnulla={() => setAzioneConferma(null)}
      />
    </div>
  );
}

export default ListaUtenti;
