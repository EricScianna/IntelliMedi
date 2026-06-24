using IntelliMedi.API.Data;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace IntelliMedi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppuntamentiController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AppuntamentiController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appuntamento>>> GetAll()
        {
            return await _context.Appuntamenti.ToListAsync();
        }

        [HttpGet("GetByMedico")]
        public async Task<ActionResult<IEnumerable<Appuntamento>>> GetByMedico(int medicoId)
        {
            //LINQ usa where per filtrare gli elementi di appuntamenti con:
            //medicoId uguale a quella ricevuta
            return await _context.Appuntamenti
            .Where(d => d.MedicoId == medicoId).ToListAsync();
        }

        [HttpGet("GetByTipologia")]
        public async Task<ActionResult<IEnumerable<Appuntamento>>> GetByTipologia(int tipologiaId)
        {
            //LINQ usa where per filtrare gli elementi di appuntamenti con:
            //tipologiaId uguale a quella ricevuta
            return await _context.Appuntamenti
            .Where(d => d.Medico.TipologiaVisite.Any(x => x.Id == tipologiaId))
            .ToListAsync();
        }

        [HttpGet("{Id}")]
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
                return Conflict();

            Appuntamento appuntamento = new Appuntamento()
            {
                Data = registrazione.Data,
                TipologiaVisitaId = registrazione.TipologiaVisitaId,
                PazienteId = registrazione.PazienteId,
                MedicoId = registrazione.MedicoId,
                Descrizione = registrazione.Descrizione
            };

            _context.Appuntamenti.Add(appuntamento);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = appuntamento.Id }, appuntamento);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Appuntamento appuntamento)
        {
            if (id != appuntamento.Id)
                return BadRequest();

            var existingAppuntamento = await _context.Appuntamenti.FindAsync(id);
            if (existingAppuntamento == null)
                return NotFound();

            existingAppuntamento.Descrizione = appuntamento.Descrizione;
            existingAppuntamento.PazienteId = appuntamento.PazienteId;
            existingAppuntamento.Paziente = appuntamento.Paziente;
            existingAppuntamento.MedicoId = appuntamento.MedicoId;
            existingAppuntamento.Medico = appuntamento.Medico;
            existingAppuntamento.TipologiaVisitaId = appuntamento.TipologiaVisitaId;
            existingAppuntamento.TipologiaVisita = appuntamento.TipologiaVisita;

            await _context.SaveChangesAsync();
            return NoContent();
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
