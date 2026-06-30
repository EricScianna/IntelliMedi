using IntelliMedi.API.Data;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace IntelliMedi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DisponibilitaMedicoController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly Expression<Func<DisponibilitaMedico, DisponibilitaMedicoResponse>> ProiezioneResponse = a => new DisponibilitaMedicoResponse
        {
            Id = a.Id,
            MedicoId = a.MedicoId,
            MedicoNome = a.Medico.Nome,
            MedicoCognome = a.Medico.Cognome,
            TipologiaVisitaId = a.Medico.TipologiaVisite.Select(t => t.Id).FirstOrDefault(),
            Giorno = a.Giorno,
            OraInizio = a.OraInizio,
            OraFine = a.OraFine,
        };
        public DisponibilitaMedicoController(AppDbContext context)
        {
            _context = context;
        }

        //ASP.NET ha bisogno di decoratori diversi per richiamare il giusto metodo
        //l'URL sarà: GET /api/DisponibilitaMedico/GetByTipologia?tipologiaId=
        [HttpGet("GetByTipologia")]
        public async Task<ActionResult<IEnumerable<DisponibilitaMedicoResponse>>> GetByTipologia(int tipologiaId)
        {
            //LINQ usa where per filtrare gli elementi di disponibilitaMedici con:
            //tipologiaId uguale a quella ricevuta
            return await _context.DisponibilitaMedici
            .Where(d => d.Medico.TipologiaVisite
            .Any(x => x.Id == tipologiaId))
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        //l'URL sarà: GET /api/DisponibilitaMedico/GetAllDays?medicoId=
        [HttpGet("GetAllDays")]
        public async Task<ActionResult<IEnumerable<DisponibilitaMedicoResponse>>> GetAllDays(int medicoId)
        {
            //LINQ usa where per filtrare gli elementi di disponibilitaMedici con:
            //MedicoId uguale a quello del medico ricevuto
            return await _context.DisponibilitaMedici
            .Where(d => d.MedicoId == medicoId)
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        //restituisce tutti i medici che hanno disponibilità
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DisponibilitaMedicoResponse>>> GetAll()
        {
            return await _context.DisponibilitaMedici
                .Select(ProiezioneResponse)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DisponibilitaMedico>> GetById(int id)
        {
            var disponibilitaMedico = await _context.DisponibilitaMedici.FindAsync(id);
            if (disponibilitaMedico == null)
                return NotFound();

            return disponibilitaMedico;
        }

        [HttpPost]
        public async Task<IActionResult> Create(DisponibilitaMedicoRequest registrazione)
        {
            DisponibilitaMedico disponibilitaMedico = new()
            {
                Giorno = registrazione.Giorno,
                MedicoId = registrazione.MedicoId,
                OraInizio = registrazione.OraInizio,
                OraFine = registrazione.OraFine
            };
            _context.DisponibilitaMedici.Add(disponibilitaMedico);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = disponibilitaMedico.Id }, disponibilitaMedico);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existingDisponibilitaMedico = await _context.DisponibilitaMedici.FindAsync(id);
            if (existingDisponibilitaMedico == null)
                return NotFound();

            _context.DisponibilitaMedici.Remove(existingDisponibilitaMedico);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
