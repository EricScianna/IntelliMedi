using System.Text.Json.Serialization;

namespace IntelliMedi.API.Models
{
    public abstract class Utente
    {
        public int Id { get; set; }
        public required string Nome { get; set; }
        public required string Cognome { get; set; }
        public required string Username { get; set; }
        [JsonIgnore]
        public string PasswordHash { get; set; } = null!;
    }
}
