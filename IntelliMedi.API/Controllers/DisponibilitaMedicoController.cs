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
    public class DisponibilitaMedicoController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DisponibilitaMedicoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DisponibilitaMedico>>> GetAll()
        {
            return await _context.DisponibilitaMedici.ToListAsync();
        }

        [HttpGet("{Id}")]
        public async Task<ActionResult<DisponibilitaMedico>> GetById(int id)
        {
            var DisponibilitaMedico = await _context.DisponibilitaMedici.FindAsync(id);
            if (DisponibilitaMedico == null)
                return NotFound();

            return DisponibilitaMedico;
        }

        [HttpPost]
        public async Task<IActionResult> Create(DisponibilitaMedico DisponibilitaMedico)
        {
            _context.DisponibilitaMedici.Add(DisponibilitaMedico);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = DisponibilitaMedico.Id }, DisponibilitaMedico);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, DisponibilitaMedico DisponibilitaMedico)
        {
            if (id != DisponibilitaMedico.Id)
                return BadRequest();

            var existingDisponibilitaMedico = await _context.DisponibilitaMedici.FindAsync(id);
            if (existingDisponibilitaMedico == null)
                return NotFound();

            existingDisponibilitaMedico.OraFine = DisponibilitaMedico.OraFine;
            existingDisponibilitaMedico.OraInizio = DisponibilitaMedico.OraInizio;
            existingDisponibilitaMedico.MedicoId = DisponibilitaMedico.MedicoId;
            existingDisponibilitaMedico.Medico = DisponibilitaMedico.Medico;
            existingDisponibilitaMedico.Giorno = DisponibilitaMedico.Giorno;

            await _context.SaveChangesAsync();
            return NoContent();
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
