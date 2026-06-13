namespace IntelliMedi.API.Models
{
    public class ModificaAnagraficaRequest
    {
        public required string Nome { get; set; }
        public required string Cognome { get; set; }
        public ICollection<TipologiaVisitaDto>? TipologiaVisite { get; set; } = new List<TipologiaVisitaDto>();
        public string? CodiceFiscale { get; set; }
        public DateTime DataNascita { get; set; }
        public Sesso Sesso { get; set; }
    }
}