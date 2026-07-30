using System.Text.Json.Serialization;

namespace IntelliMedi.API.Models
{
    public class MedicoResponse
    {
        public required int Id { get; set; }
        public required string Nome { get; set; }
        public required string Cognome { get; set; }
        public required List<TipologiaVisitaDto> TipologiaVisite { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? CodiceFiscale { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? DataNascita { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Sesso? Sesso { get; set; }
    }
}
