namespace IntelliMedi.API.Models
{
    public class TipologiaVisita
    {
        public int Id { get; set; }
        public ICollection<Medico> Medici { get; set; } = new List<Medico>();
        public required string Descrizione { get; set; }
    }
}
