namespace IntelliMedi.API.Models
{
    public class Appuntamento
    {
        public int Id { get; set; }
        public DateTime Data { get; set; }
        public int TipologiaVisitaId { get; set; }
        public TipologiaVisita TipologiaVisita { get; set; } = null!;
        public int PazienteId { get; set; }
        public Paziente Paziente { get; set; } = null!;
        public int MedicoId { get; set; }
        public Medico Medico { get; set; } = null!;
        public string? Descrizione { get; set; }
    }
}
