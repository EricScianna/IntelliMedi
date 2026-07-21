namespace IntelliMedi.API.Models
{
    public class CalendarioResponse
    {
        public int? Id { get; set; }
        public DateTime Data { get; set; }
        public int MedicoId { get; set; }
        public bool Mio { get; set; }
    }
}
