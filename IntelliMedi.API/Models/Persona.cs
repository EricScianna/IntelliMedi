namespace IntelliMedi.API.Models
{
    public enum Sesso { M, F, Altro };

    public abstract class Persona : Utente
    {
        public string? CodiceFiscale { get; set; }
        public DateTime DataNascita { get; set; }
        public Sesso Sesso { get; set; }
    }
}
