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
        public async Task<ActionResult<IEnumerable<TipologiaVisita>>> GetAll()
        {
            return await _context.TipologieVisita.ToListAsync();
        }

        [HttpGet("{Id}")]
        public async Task<ActionResult<TipologiaVisita>> GetById(int id)
        {
            var TipologiaVisita = await _context.TipologieVisita.FindAsync(id);
            if (TipologiaVisita == null)
                return NotFound();

            return TipologiaVisita;
        }

        [HttpPost]
        public async Task<IActionResult> Create(TipologiaVisita TipologiaVisita)
        {
            _context.TipologieVisita.Add(TipologiaVisita);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = TipologiaVisita.Id }, TipologiaVisita);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, TipologiaVisita TipologiaVisita)
        {
            if (id != TipologiaVisita.Id)
                return BadRequest();

            var existingTipologiaVisita = await _context.TipologieVisita.FindAsync(id);
            if (existingTipologiaVisita == null)
                return NotFound();

            existingTipologiaVisita.Descrizione = TipologiaVisita.Descrizione;
            existingTipologiaVisita.Medici = TipologiaVisita.Medici;

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
