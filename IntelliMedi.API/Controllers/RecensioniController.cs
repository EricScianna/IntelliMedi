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
    public class RecensioniController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RecensioniController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Recensione>>> GetAll()
        {
            return await _context.Recensioni.ToListAsync();
        }

        [HttpGet("{Id}")]
        public async Task<ActionResult<Recensione>> GetById(int id)
        {
            var Recensione = await _context.Recensioni.FindAsync(id);
            if (Recensione == null)
                return NotFound();

            return Recensione;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Recensione Recensione)
        {
            _context.Recensioni.Add(Recensione);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = Recensione.Id }, Recensione);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Recensione Recensione)
        {
            if (id != Recensione.Id)
                return BadRequest();

            var existingRecensione = await _context.Recensioni.FindAsync(id);
            if (existingRecensione == null)
                return NotFound();

            existingRecensione.Descrizione = Recensione.Descrizione;
            existingRecensione.PazienteId = Recensione.PazienteId;
            existingRecensione.Paziente = Recensione.Paziente;
            existingRecensione.MedicoId = Recensione.MedicoId;
            existingRecensione.Medico = Recensione.Medico;
            existingRecensione.Voto = Recensione.Voto;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existingRecensione = await _context.Recensioni.FindAsync(id);
            if (existingRecensione == null)
                return NotFound();

            _context.Recensioni.Remove(existingRecensione);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
