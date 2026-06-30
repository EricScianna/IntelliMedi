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
    public class TipologiaVisitaController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TipologiaVisitaController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TipologiaVisitaDto>>> GetAll()
        {
            return await _context.TipologieVisita
                .Select(t => new TipologiaVisitaDto
                {
                    Id = t.Id,
                    Descrizione = t.Descrizione
                })
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TipologiaVisita>> GetById(int id)
        {
            var tipologiaVisita = await _context.TipologieVisita.FindAsync(id);
            if (tipologiaVisita == null)
                return NotFound();

            return tipologiaVisita;
        }

        [HttpPost]
        public async Task<IActionResult> Create(TipologiaVisita tipologiaVisita)
        {
            _context.TipologieVisita.Add(tipologiaVisita);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = tipologiaVisita.Id }, tipologiaVisita);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, TipologiaVisita tipologiaVisita)
        {
            if (id != tipologiaVisita.Id)
                return BadRequest();

            var existingTipologiaVisita = await _context.TipologieVisita.FindAsync(id);
            if (existingTipologiaVisita == null)
                return NotFound();

            existingTipologiaVisita.Descrizione = tipologiaVisita.Descrizione;
            existingTipologiaVisita.Medici = tipologiaVisita.Medici;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existingTipologiaVisita = await _context.TipologieVisita.FindAsync(id);
            if (existingTipologiaVisita == null)
                return NotFound();

            _context.TipologieVisita.Remove(existingTipologiaVisita);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
