import type { DatiForm, TipologiaVisita } from "../types";

function FormDatiUtente({
  titolo,
  submitUtente,
  form,
  setForm,
  isMostraServizi,
  tipologiaVisite,
  username,
  password,
  setUsername,
  setPassword,
  children,
}: Readonly<{
  titolo: string;
  submitUtente: (contenutoForm: React.SubmitEvent<HTMLFormElement>) => void;
  form: DatiForm;
  setForm: React.Dispatch<React.SetStateAction<DatiForm>>;
  isMostraServizi: boolean;
  tipologiaVisite?: TipologiaVisita[] | null;
  username: string;
  password: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  children: React.ReactNode;
}>) {
  return (
    <div className="card-body p-5 shadow-5 text-center">
      <h2 className="fw-bold mb-5">{titolo}</h2>
      <form onSubmit={submitUtente}>
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="form-floating">
              <input type="text" id="Nome" className="form-control" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              <label htmlFor="Nome">Nome</label>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="form-floating">
              <input type="text" id="Cognome" className="form-control" value={form.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} required />
              <label htmlFor="Cognome">Cognome</label>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="form-floating">
              <select className="form-select" id="sesso" value={form.sesso} onChange={(e) => setForm({ ...form, sesso: Number.parseInt(e.target.value) })} required>
                <option value="0">Maschio</option>
                <option value="1">Femmina</option>
                <option value="2">Non specificato</option>
              </select>
              <label htmlFor="sesso">Sesso</label>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="form-floating">
              <input type="date" id="DataNascita" className="form-control" value={form.dataNascita} onChange={(e) => setForm({ ...form, dataNascita: e.target.value })} required />
              <label htmlFor="DataNascita">Data di nascita</label>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="form-floating">
              <input type="text" id="CodiceFiscale" className="form-control" value={form.codiceFiscale} onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value })} required/>
              <label htmlFor="CodiceFiscale">Codice fiscale</label>
            </div>
          </div>
          {isMostraServizi && (
            <div className="col-md-4 mb-4">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="servizi"
                  value={form?.tipologiaVisite?.[0]?.id ?? ""}
                  onChange={(e) => {
                    const servizio = tipologiaVisite?.find((t) => t.id === Number(e.target.value));
                    if (servizio) setForm({ ...form, tipologiaVisite: [servizio] });
                  }}
                >
                  <option value=""></option>
                  {tipologiaVisite?.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.descrizione}
                    </option>
                  ))}
                </select>
                <label htmlFor="servizi">Servizi</label>
              </div>
            </div>
          )}
        </div>
        <div className="form-floating mb-4">
          <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} id="username" />
          <label htmlFor="username">username</label>
        </div>
        <div className="form-floating mb-4">
          <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} id="Password" />
          <label htmlFor="Password">Password</label>
        </div>
        {children}
      </form>
    </div>
  );
}
export default FormDatiUtente;
