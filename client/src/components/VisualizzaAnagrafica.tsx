import { SESSO_LABELS } from "../constants";
import type { User } from "../types";

function VisualizzaAnagrafica({ utente, mostraServizi, clickModificaInAnagrafica }: Readonly<{ utente: User | null; mostraServizi: boolean; clickModificaInAnagrafica: (utente: User) => void }>) {
  return (
    <div className="card-body">
      <table className="table">
        <tbody>
          <tr>
            <th scope="row">Nome</th>
            <td>{utente?.nome}</td>
          </tr>
          <tr>
            <th scope="row">Cognome</th>
            <td>{utente?.cognome}</td>
          </tr>
          {mostraServizi && (
            <tr>
              <th scope="row">Servizi</th>
              <td>{utente?.tipologiaVisite?.[0]?.descrizione}</td>
            </tr>
          )}
          <tr>
            <th scope="row">Codice Fiscale</th>
            <td>{utente?.codiceFiscale ?? "/"}</td>
          </tr>
          <tr>
            <th scope="row">Data di Nascita</th>
            <td>{new Date(utente?.dataNascita ?? "").toLocaleDateString("it-IT")}</td>
          </tr>
          <tr>
            <th scope="row">Sesso</th>
            <td>{SESSO_LABELS[utente?.sesso ?? 2]} </td>
          </tr>
        </tbody>
      </table>
      <button type="button" className="btn btn-primary" onClick={() => utente && clickModificaInAnagrafica(utente)}>
        Modifica
      </button>
    </div>
  );
}

export default VisualizzaAnagrafica;
