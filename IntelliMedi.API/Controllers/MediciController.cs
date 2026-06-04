using IntelliMedi.API.Data;
using IntelliMedi.API.Migrations;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntelliMedi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MediciController : ControllerBase
    {
        private readonly AppDbContext _context;
        public MediciController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedicoResponse>>> GetAll()
        {
            return _context.Medici.Include(m => m.TipologiaVisite).ToList().Select(m => new MedicoResponse()
            {
                Id = m.Id,
                Nome = m.Nome,
                Cognome = m.Cognome,
                TipologiaVisite = (m.TipologiaVisite?.ToList() ?? new List<TipologiaVisita>()).Select(t => t.Descrizione).ToList(),
                Sesso = m.Sesso,
                DataNascita = m.DataNascita,
                CodiceFiscale = m.CodiceFiscale
            }).ToList();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Medico>> GetById(int id)
        {
            var medico = await _context.Medici.FindAsync(id);
            if (medico == null)
                return NotFound();
            return medico;
        }

        [HttpPost]
        [Authorize(Roles = "Amministratore")]
        public async Task<ActionResult<Medico>> Create(RegistrazioneRequest registrazione)
        {
            if (_context.Medici.Any(p => p.Username == registrazione.Username))
                return BadRequest();

            List<TipologiaVisita> listaTipologieVisite = new List<TipologiaVisita>();

            if (registrazione.TipologiaVisite != null)
            {
                foreach (TipologiaVisita tipologia in registrazione.TipologiaVisite)
                {
                    var trovata = await _context.TipologieVisita.FindAsync(tipologia.Id);
                    if (trovata != null) listaTipologieVisite.Add(trovata);
                }
            }
            Medico medico = new Medico
            {
                Nome = registrazione.Nome,
                Cognome = registrazione.Cognome,
                Sesso = registrazione.Sesso,
                DataNascita = registrazione.DataNascita,
                CodiceFiscale = registrazione.CodiceFiscale,
                Username = registrazione.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registrazione.Password),
                TipologiaVisite = listaTipologieVisite
            };

            _context.Medici.Add(medico);
            await _context.SaveChangesAsync();
            return Created();
        }

        [HttpPut("{Id}")]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> Update(int id, Medico medico)
        {
            if (id != medico.Id)
                BadRequest();

            var existingMedico = await _context.Medici.FindAsync(id);
            if (existingMedico == null)
                return NotFound();

            existingMedico.Nome = medico.Nome;
            existingMedico.Cognome = medico.Cognome;
            existingMedico.CodiceFiscale = medico.CodiceFiscale;
            existingMedico.DataNascita = medico.DataNascita;
            existingMedico.Sesso = medico.Sesso;
            existingMedico.Username = medico.Username;
            existingMedico.PasswordHash = medico.PasswordHash;
            existingMedico.Disponibilita = medico.Disponibilita;
            existingMedico.Recensioni = medico.Recensioni;
            existingMedico.TipologiaVisite = medico.TipologiaVisite;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{Id}")]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> Delete(int id)
        {

            var existingMedico = await _context.Medici.FindAsync(id);
            if (existingMedico == null)
                return NotFound();

            _context.Medici.Remove(existingMedico);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
