function ConfermaEliminazione({ mostra, messaggio, onConferma, onAnnulla }: Readonly<{ mostra: boolean; messaggio: string; onConferma: () => void; onAnnulla: () => void }>) {
  if (!mostra) return null; // se non deve mostrarsi, non renderizza nulla
  return (
    <>
      <div className="modal d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Conferma eliminazione</h5>
              <button type="button" className="btn-close" onClick={onAnnulla}></button>
            </div>
            <div className="modal-body">
              <p className="m-0">{messaggio}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onAnnulla}>
                Annulla
              </button>
              <button type="button" className="btn btn-danger" onClick={onConferma}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
}

export default ConfermaEliminazione;
