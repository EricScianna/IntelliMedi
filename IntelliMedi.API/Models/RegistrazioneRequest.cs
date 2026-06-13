namespace IntelliMedi.API.Models
{
    public class RegistrazioneRequest
    {
        public required string Nome { get; set; }
        public required string Cognome { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }
        public string? CodiceFiscale { get; set; }
        public DateTime DataNascita { get; set; }
        public Sesso Sesso { get; set; }
        public ICollection<TipologiaVisitaDto>? TipologiaVisite { get; set; } = new List<TipologiaVisitaDto>();

    }
}
