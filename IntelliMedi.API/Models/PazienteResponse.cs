namespace IntelliMedi.API.Models
{
    public class PazienteResponse
    {
        public required int Id { get; set; }
        public required string Nome { get; set; }
        public required string Cognome { get; set; }
        public string? CodiceFiscale { get; set; }
        public DateTime DataNascita { get; set; }
        public Sesso Sesso { get; set; }
    }
}
