namespace IntelliMedi.API.Models
{
    public class DisponibilitaMedicoRequest
    {
        //necessaria la creazione del DTO (in questo caso request) perché il model DisponibilitaMedico richiederebbe l'entità Medico
        public int MedicoId { get; set; }
        public DayOfWeek Giorno { get; set; }
        public TimeOnly OraInizio { get; set; }
        public TimeOnly OraFine { get; set; }
        public DateOnly? Data { get; set; }
        public bool Disponibile { get; set; } = true;
    }
}
