namespace IntelliMedi.API.Models
{
    public class Recensione
    {
        public int Id { get; set; }
        public int PazienteId { get; set; }
        public Paziente Paziente { get; set; } = null!;
        public int MedicoId { get; set; }
        public Medico Medico { get; set; } = null!;
        public int Voto { get; set; }
        public string? Descrizione { get; set; }
    }
}
