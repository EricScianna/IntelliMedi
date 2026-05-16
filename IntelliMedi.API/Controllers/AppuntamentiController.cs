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

        [HttpGet("{Id}")]
        public async Task<ActionResult<Appuntamento>> GetById(int id)
        {
            var appuntamento = await _context.Appuntamenti.FindAsync(id);
            if (appuntamento == null)
                return NotFound();

            return appuntamento;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Appuntamento appuntamento)
        {
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
