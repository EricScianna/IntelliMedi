using Microsoft.EntityFrameworkCore;
using IntelliMedi.API.Models;

namespace IntelliMedi.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Paziente> Pazienti { get; set; }
        public DbSet<Medico> Medici { get; set; }
        public DbSet<Amministratore> Amministratori { get; set; }
        public DbSet<Appuntamento> Appuntamenti { get; set; }
        public DbSet<Recensione> Recensioni { get; set; }
        public DbSet<TipologiaVisita> TipologieVisita { get; set; }
        public DbSet<DisponibilitaMedico> DisponibilitaMedici { get; set; }
    }
}