namespace IntelliMedi.API.Models
{
    public class Paziente : Utente
    {
        public ICollection<Appuntamento> Appuntamenti { get; set; } = new List<Appuntamento>();
        public ICollection<Recensione> Recensioni { get; set; } = new List<Recensione>();
    }
}