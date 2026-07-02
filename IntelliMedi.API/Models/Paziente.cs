namespace IntelliMedi.API.Models
{
    public class Paziente : Persona
    {
        public ICollection<Appuntamento> Appuntamenti { get; set; } = new List<Appuntamento>();
    }
}