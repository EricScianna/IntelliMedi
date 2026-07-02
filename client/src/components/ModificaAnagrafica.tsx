import { SESSO_LABELS } from "../constants";
import type { DatiForm, TipologiaVisita } from "../types";

function ModificaAnagrafica({
  submitAnagrafica,
  form,
  setForm,
  mostraServizi,
  serviziModificabili,
  tipologiaVisite,
  clickAnnulla,
}: Readonly<{
  submitAnagrafica: (contenutoForm: React.SubmitEvent<HTMLFormElement>) => void;
  form: DatiForm;
  setForm: React.Dispatch<React.SetStateAction<DatiForm>>;
  mostraServizi: boolean;
  serviziModificabili: boolean;
  tipologiaVisite: TipologiaVisita[] | null;
  clickAnnulla: () => void;
}>) {
  return (
    <div className="form-floating card-body">
      <form onSubmit={submitAnagrafica}>
        <table className="table">
          <tbody>
            <tr>
              <th scope="row">Nome</th>
              <td>
                <input type="text" id="Nome" className="form-control" value={form?.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </td>
            </tr>
            <tr>
              <th scope="row">Cognome</th>
              <td>
                <input type="text" id="Cognome" className="form-control" value={form?.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} required />
              </td>
            </tr>
            {mostraServizi && (
              <tr>
                <th scope="row">Servizi</th>
                <td>
                  <select
                    id="Servizi"
                    className="form-select"
                    value={form?.tipologiaVisite?.[0]?.id ?? ""}
                    disabled={!serviziModificabili}
                    onChange={(e) => {
                      const servizio = tipologiaVisite?.find((t) => t.id === Number(e.target.value));
                      setForm({ ...form, tipologiaVisite: servizio ? [servizio] : [] });
                    }}
                  >
                    <option value=""></option>
                    {tipologiaVisite?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.descrizione}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )}
            <tr>
              <th scope="row">Codice Fiscale</th>
              <td>
                <input type="text" id="CodiceFiscale" className="form-control" value={form?.codiceFiscale ?? "/"} onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value })} required />
              </td>
            </tr>
            <tr>
              <th scope="row">Data di Nascita</th>
              <td>
                <input type="date" id="DataNascita" className="form-control" value={form?.dataNascita?.split("T")[0]} onChange={(e) => setForm({ ...form, dataNascita: e.target.value })} required />
              </td>
            </tr>
            <tr>
              <th scope="row">Sesso</th>
              <td>
                <select id="Sesso" className="form-select" value={form?.sesso} onChange={(e) => setForm({ ...form, sesso: Number(e.target.value) })} required>
                  {SESSO_LABELS.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <button type="submit" className="btn btn-success me-5">
          Modifica
        </button>
        <button type="button" className="btn btn-danger" onClick={clickAnnulla}>
          Annulla
        </button>
      </form>
    </div>
  );
}
export default ModificaAnagrafica;
