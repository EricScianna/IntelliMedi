function Avvisi({ errore, clickChiudi }: Readonly<{ errore: string; clickChiudi: () => void }>) {
  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-5">
      <div className="toast show bg-warning" role="alert" aria-live="assertive" aria-atomic="true">
        <div className="toast-header ">
          <strong className="me-auto">Errore</strong>
          <button type="button" className="btn-close" onClick={clickChiudi}></button>
        </div>
        <div className="toast-body">{errore}</div>
      </div>
    </div>
  );
}
export default Avvisi;
