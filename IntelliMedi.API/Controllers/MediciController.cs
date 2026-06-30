using IntelliMedi.API.Data;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
            var lista = await _context.Medici.Include(m => m.TipologiaVisite).ToListAsync();
            return lista.Select(MedicoToMedicoResponse).ToList();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MedicoResponse>> GetById(int id)
        {
            var existingMedico = await _context.Medici.Include(m => m.TipologiaVisite).FirstOrDefaultAsync(m => m.Id == id);

            if (existingMedico == null)
                return NotFound();

            return MedicoToMedicoResponse(existingMedico);
        }

        [HttpPost]
        [Authorize(Roles = "Amministratore")]
        public async Task<ActionResult<Medico>> Create(RegistrazioneRequest registrazione)
        {
            if (_context.Medici.Any(p => p.Username == registrazione.Username))
                return BadRequest();

            if (_context.Medici.Any(p => p.CodiceFiscale == registrazione.CodiceFiscale))
                return BadRequest("Codice fiscale già registrato");

            List<TipologiaVisita> listaTipologieVisite = new List<TipologiaVisita>();

            if (registrazione.TipologiaVisite != null)
            {
                foreach (TipologiaVisitaDto tipologia in registrazione.TipologiaVisite)
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

        [HttpPut("{id}")]
        [Authorize(Roles = "Amministratore,Medico")]
        public async Task<IActionResult> Update(int id, ModificaAnagraficaRequest modifica)
        {
            if (User.IsInRole("Medico"))
            {
                var idUtenteLoggato = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (idUtenteLoggato != id.ToString()) return Forbid();
            }

            if (_context.Medici.Any(p => p.CodiceFiscale == modifica.CodiceFiscale && p.Id != id))
                return BadRequest("Codice fiscale già registrato");

            var existingMedico = await _context.Medici.Include(m => m.TipologiaVisite).FirstOrDefaultAsync(m => m.Id == id);
            if (existingMedico == null) return NotFound();

            if (User.IsInRole("Amministratore"))
            {
                List<TipologiaVisita> listaTipologieVisite = new List<TipologiaVisita>();

                if (modifica.TipologiaVisite != null)
                {
                    foreach (TipologiaVisitaDto dto in modifica.TipologiaVisite)
                    {
                        var trovata = await _context.TipologieVisita.FindAsync(dto.Id);
                        if (trovata != null) listaTipologieVisite.Add(trovata);
                    }
                }
                existingMedico.TipologiaVisite = listaTipologieVisite;
            }

            existingMedico.Nome = modifica.Nome;
            existingMedico.Cognome = modifica.Cognome;
            existingMedico.CodiceFiscale = modifica.CodiceFiscale;
            existingMedico.DataNascita = modifica.DataNascita;
            existingMedico.Sesso = modifica.Sesso;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
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

        private MedicoResponse MedicoToMedicoResponse(Medico medico)
        {
            MedicoResponse nuovoMedico = new MedicoResponse
            {
                Id = medico.Id,
                Nome = medico.Nome,
                Cognome = medico.Cognome,
                TipologiaVisite = (medico.TipologiaVisite?.ToList() ?? new List<TipologiaVisita>()).Select(t => new TipologiaVisitaDto { Id = t.Id, Descrizione = t.Descrizione }).ToList(),
                Sesso = medico.Sesso,
                DataNascita = medico.DataNascita,
                CodiceFiscale = medico.CodiceFiscale
            };
            return nuovoMedico;
        }
    }
}