namespace IntelliMedi.API.Models
{
    public class DisponibilitaMedico
    {
        public int Id { get; set; }
        public int MedicoId { get; set; }
        public Medico Medico { get; set; } = null!;
        public DayOfWeek Giorno { get; set; }
        public TimeOnly OraInizio { get; set; }
        public TimeOnly OraFine { get; set; }
        public DateOnly? Data { get; set; }
        public bool Disponibile { get; set; } = true;
    }
}
