namespace IntelliMedi.API.Models
{
    public class AppuntamentoRequest
    {
        public DateTime Data { get; set; }
        public int TipologiaVisitaId { get; set; }
        public int PazienteId { get; set; }
        public int MedicoId { get; set; }
    }
}
