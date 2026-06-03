using IntelliMedi.API.Data;
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
        public async Task<ActionResult<IEnumerable<Medico>>> GetAll()
        {
            return await _context.Medici.ToListAsync();
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
        public async Task<ActionResult<Medico>> Create(Medico medico)
        {
            medico.PasswordHash = BCrypt.Net.BCrypt.HashPassword(medico.PasswordHash);
            _context.Medici.Add(medico);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = medico.Id }, medico);
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
