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

        [HttpPost]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> Create(TipologiaVisitaDto tipologiaVisita)
        {
            if (string.IsNullOrWhiteSpace(tipologiaVisita.Descrizione))
                return BadRequest("Inserire una descrizione per la tipologia di visita");

            TipologiaVisita tipologia = new TipologiaVisita
            { Descrizione = tipologiaVisita.Descrizione };

            _context.TipologieVisita.Add(tipologia);
            await _context.SaveChangesAsync();
            return Created();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> Update(int id, TipologiaVisitaDto tipologiaVisita)
        {
            if (string.IsNullOrWhiteSpace(tipologiaVisita.Descrizione))
                return BadRequest("Inserire una descrizione per la tipologia di visita");

            if (id != tipologiaVisita.Id)
                return BadRequest();

            var existingTipologiaVisita = await _context.TipologieVisita.FindAsync(id);
            if (existingTipologiaVisita == null)
                return NotFound();

            existingTipologiaVisita.Descrizione = tipologiaVisita.Descrizione;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Amministratore")]
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
