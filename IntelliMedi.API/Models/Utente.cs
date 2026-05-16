namespace IntelliMedi.API.Models
{
    public enum Sesso { M, F, Altro };
    public abstract class Utente
    {
        public int Id { get; set; }
        public required string Nome { get; set; }
        public required string Cognome { get; set; }
        public string? CodiceFiscale { get; set; }
        public DateTime DataNascita { get; set; }
        public Sesso Sesso { get; set; }
        public required string Username { get; set; }
        public required string PasswordHash { get; set; }
    }
}
