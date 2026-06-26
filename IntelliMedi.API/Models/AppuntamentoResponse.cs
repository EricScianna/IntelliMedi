namespace IntelliMedi.API.Models
{
    public class AppuntamentoResponse
    {
        public int Id { get; set; }
        public DateTime Data { get; set; }
        public int MedicoId { get; set; }
        public int PazienteId { get; set; }
        public int TipologiaVisitaId { get; set; }
        public string MedicoNome { get; set; }
        public string MedicoCognome { get; set; }
        public string PazienteNome { get; set; }
        public string PazienteCognome { get; set; }
        public string TipologiaVisita { get; set; }
        public string? Descrizione { get; set; }
    }
}
