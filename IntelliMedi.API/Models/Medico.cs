namespace IntelliMedi.API.Models
{
    public class Medico : Persona
    {
        public ICollection<TipologiaVisita> TipologiaVisite { get; set; } = new List<TipologiaVisita>();
        public ICollection<Appuntamento> Appuntamenti { get; set; } = new List<Appuntamento>();
        public ICollection<DisponibilitaMedico> Disponibilita { get; set; } = new List<DisponibilitaMedico>();
        public override string Ruolo => "Medico";

    }
}
