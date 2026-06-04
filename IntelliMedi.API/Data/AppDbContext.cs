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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TipologiaVisita>().HasData
                (new TipologiaVisita
                {
                    Id = 1,
                    Descrizione = "Visita sportiva"
                },
                new TipologiaVisita
                {
                    Id = 2,
                    Descrizione = "Ortopedia"
                },
                new TipologiaVisita
                {
                    Id = 3,
                    Descrizione = "Nutrizione"
                }, new TipologiaVisita
                {
                    Id = 4,
                    Descrizione = "Cardiologia"
                }, new TipologiaVisita
                {
                    Id = 5,
                    Descrizione = "Psicologia"
                }, new TipologiaVisita
                {
                    Id = 6,
                    Descrizione = "Fisioterapia"
                },
                new TipologiaVisita
                {
                    Id = 7,
                    Descrizione = "Holter cardiaco"
                },
                new TipologiaVisita
                {
                    Id = 8,
                    Descrizione = "Onde d'urto"
                })
                ;
        }
    }
}