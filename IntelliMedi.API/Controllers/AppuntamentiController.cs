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
    public class AppuntamentiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly Expression<Func<Appuntamento, AppuntamentoResponse>> ProiezioneResponse =
            a => new AppuntamentoResponse
            {
                Id = a.Id,
                Data = a.Data,
                MedicoId = a.MedicoId,
                PazienteId = a.PazienteId,
                TipologiaVisitaId = a.TipologiaVisitaId,
                MedicoNome = a.Medico.Nome,
                MedicoCognome = a.Medico.Cognome,
                PazienteNome = a.Paziente.Nome,
                PazienteCognome = a.Paziente.Cognome,
                TipologiaVisita = a.TipologiaVisita.Descrizione,
            };
        public AppuntamentiController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetByPaziente")]
        public async Task<ActionResult<IEnumerable<AppuntamentoResponse>>> GetByPaziente(int pazienteId)
        {
            //LINQ usa where per filtrare gli elementi di appuntamenti con:
            //medicoId uguale a quella ricevuta
            return await _context.Appuntamenti
            .Where(d => d.PazienteId == pazienteId)
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        [HttpGet("GetByMedico")]
        public async Task<ActionResult<IEnumerable<AppuntamentoResponse>>> GetByMedico(int medicoId)
        {
            //LINQ usa where per filtrare gli elementi di appuntamenti con:
            //medicoId uguale a quella ricevuta
            return await _context.Appuntamenti
            .Where(d => d.MedicoId == medicoId)
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        [HttpGet("GetByTipologia")]
        public async Task<ActionResult<IEnumerable<AppuntamentoResponse>>> GetByTipologia(int tipologiaId)
        {
            //LINQ usa where per filtrare gli elementi di appuntamenti con:
            //tipologiaId uguale a quella ricevuta
            return await _context.Appuntamenti
            .Where(d => d.Medico.TipologiaVisite
            .Any(x => x.Id == tipologiaId))
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Appuntamento>> GetById(int id)
        {
            var appuntamento = await _context.Appuntamenti.FindAsync(id);
            if (appuntamento == null)
                return NotFound();

            return appuntamento;
        }

        [HttpPost]
        public async Task<IActionResult> Create(AppuntamentoRequest registrazione)
        {
            //lo slot rientra nella disponibilità di quel medico? (giorno-settimana + ora);
            var disponibilita = await _context.DisponibilitaMedici.Where(d => d.MedicoId == registrazione.MedicoId).ToListAsync();
            var medicoDisp = disponibilita.Any(d => d.Giorno == registrazione.Data.DayOfWeek && d.OraInizio.Hour <= registrazione.Data.Hour && d.OraFine.Hour > registrazione.Data.Hour);
            if (!medicoDisp) return BadRequest("Slot fuori dalla disponibilità del medico");
            //se quel medico è già impegnato in quella data: Conflict()
            if (await _context.Appuntamenti.AnyAsync(d => d.MedicoId == registrazione.MedicoId && d.Data == registrazione.Data))
                return Conflict("Il medico è già impegnato in un altro appuntamento");
            //se il paziente ha già un appuntamento in quella data e ora
            if (await _context.Appuntamenti.AnyAsync(d => d.PazienteId == registrazione.PazienteId && d.Data == registrazione.Data))
                return Conflict("Esiste già un appuntamento in questa data e ora");
            Appuntamento appuntamento = new Appuntamento()
            {
                Data = registrazione.Data,
                TipologiaVisitaId = registrazione.TipologiaVisitaId,
                PazienteId = registrazione.PazienteId,
                MedicoId = registrazione.MedicoId,
            };

            _context.Appuntamenti.Add(appuntamento);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = appuntamento.Id }, appuntamento);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existingAppuntamento = await _context.Appuntamenti.FindAsync(id);
            if (existingAppuntamento == null)
                return NotFound();

            _context.Appuntamenti.Remove(existingAppuntamento);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
