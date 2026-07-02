namespace IntelliMedi.API.Models
{
    public class DisponibilitaMedicoResponse
    {
        public int Id { get; set; }
        public int MedicoId { get; set; }
        public string MedicoNome { get; set; }
        public string MedicoCognome { get; set; }
        public int TipologiaVisitaId { get; set; }
        public DayOfWeek Giorno { get; set; }
        public TimeOnly OraInizio { get; set; }
        public TimeOnly OraFine { get; set; }
        public DateOnly? Data { get; set; }
        public bool Disponibile { get; set; } 
    }
}
