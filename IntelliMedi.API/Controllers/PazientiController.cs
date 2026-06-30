using IntelliMedi.API.Data;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;

namespace IntelliMedi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PazientiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly Expression<Func<Paziente, PazienteResponse>> ProiezioneResponse =
            p => new PazienteResponse
            {
                Id = p.Id,
                Nome = p.Nome,
                Cognome = p.Cognome,
                CodiceFiscale = p.CodiceFiscale,
                DataNascita = p.DataNascita,
                Sesso = p.Sesso
            };

        public PazientiController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Amministratore")]
        public async Task<ActionResult<IEnumerable<PazienteResponse>>> GetAll()
        {
            return await _context.Pazienti
                .Select(ProiezioneResponse)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PazienteResponse>> GetById(int id)
        {
            var paziente = await _context.Pazienti.Where(p => p.Id == id).Select(ProiezioneResponse).FirstOrDefaultAsync();
            if (paziente == null)
                return NotFound();
            return paziente;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<Paziente>> Create(RegistrazioneRequest registrazione)
        {
            if (_context.Pazienti.Any(p => p.Username == registrazione.Username))
                return BadRequest();

            if (_context.Pazienti.Any(p => p.CodiceFiscale == registrazione.CodiceFiscale))
                return BadRequest("Codice fiscale già registrato");

            Paziente paziente = new Paziente
            {
                Nome = registrazione.Nome,
                Cognome = registrazione.Cognome,
                Sesso = registrazione.Sesso,
                DataNascita = registrazione.DataNascita,
                CodiceFiscale = registrazione.CodiceFiscale,
                Username = registrazione.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registrazione.Password)
            };

            _context.Pazienti.Add(paziente);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = paziente.Id }, paziente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ModificaAnagraficaRequest modifica)
        {
            var idUtenteLoggato = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (idUtenteLoggato != id.ToString()) return Forbid();

            if (_context.Pazienti.Any(p => p.CodiceFiscale == modifica.CodiceFiscale && p.Id != id))
                return BadRequest("Codice fiscale già registrato");

            var existingPaziente = await _context.Pazienti.FindAsync(id);
            if (existingPaziente == null) return NotFound();

            existingPaziente.Nome = modifica.Nome;
            existingPaziente.Cognome = modifica.Cognome;
            existingPaziente.CodiceFiscale = modifica.CodiceFiscale;
            existingPaziente.DataNascita = modifica.DataNascita;
            existingPaziente.Sesso = modifica.Sesso;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existingPaziente = await _context.Pazienti.FindAsync(id);
            if (existingPaziente == null)
            {
                return NotFound();
            }

            _context.Pazienti.Remove(existingPaziente);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}