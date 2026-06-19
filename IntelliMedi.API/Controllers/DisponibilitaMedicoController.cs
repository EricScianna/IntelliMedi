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

        //ASP.NET ha bisogno di decoratori diversi per richiamare il giusto metodo
        //l'URL sarà: GET /api/DisponibilitaMedico/GetSingleDay?medicoId=3&data=2026-06-23
        [HttpGet("GetSingleDay")]
        public async Task<ActionResult<IEnumerable<DisponibilitaMedico>>> GetSingleDay(int medicoId, DateOnly data)
        {
            //LINQ usa where per filtrare gli elementi di disponibilitaMedici con:
            //MedicoId uguale a quello del medico ricevuto
            //stesso giorno della settimana ricevuto
            return await _context.DisponibilitaMedici
            .Where(d => d.MedicoId == medicoId && d.Giorno == data.DayOfWeek)
            .ToListAsync();
        }

        //ASP.NET ha bisogno di decoratori diversi per richiamare il giusto metodo
        //l'URL sarà: GET /api/DisponibilitaMedico/GetAllDays
        [HttpGet("GetAllDays")]
        public async Task<ActionResult<IEnumerable<DisponibilitaMedico>>> GetAllDays(int medicoId)
        {
            //LINQ usa where per filtrare gli elementi di disponibilitaMedici con:
            //MedicoId uguale a quello del medico ricevuto
            return await _context.DisponibilitaMedici
            .Where(d => d.MedicoId == medicoId)
            .ToListAsync();
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
        public async Task<IActionResult> Create(DisponibilitaMedicoRequest registrazione)
        {
            DisponibilitaMedico disponibilitaMedico = new DisponibilitaMedico
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
