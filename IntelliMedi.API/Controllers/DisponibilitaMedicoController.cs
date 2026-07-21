using IntelliMedi.API.Data;
using IntelliMedi.API.Extensions;
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
            Data = a.Data,
            Disponibile = a.Disponibile,
        };
        public DisponibilitaMedicoController(AppDbContext context)
        {
            _context = context;
        }

        //ASP.NET ha bisogno di decoratori diversi per richiamare il giusto metodo
        //l'URL sarà: GET /api/DisponibilitaMedico/GetByTipologia?tipologiaId=
        [HttpGet("GetByTipologia")]
        [Authorize(Roles = "Amministratore,Paziente")]
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
            if (User.IsInRole("Medico") && (User.IdUtenteLoggato() != medicoId)) return Forbid();
            //LINQ usa where per filtrare gli elementi di disponibilitaMedici con:
            //MedicoId uguale a quello del medico ricevuto
            return await _context.DisponibilitaMedici
            .Where(d => d.MedicoId == medicoId)
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        //restituisce tutti i medici che hanno disponibilità
        [HttpGet]
        [Authorize(Roles = "Amministratore")]
        public async Task<ActionResult<IEnumerable<DisponibilitaMedicoResponse>>> GetAll()
        {
            return await _context.DisponibilitaMedici
                .Select(ProiezioneResponse)
                .ToListAsync();
        }

        [HttpPost]
        [Authorize(Roles = "Amministratore,Medico")]
        public async Task<IActionResult> Create(DisponibilitaMedicoRequest registrazione)
        {
            if (User.IsInRole("Medico") && (User.IdUtenteLoggato() != registrazione.MedicoId)) return Forbid();
            if (registrazione.OraInizio >= registrazione.OraFine) return BadRequest("L'orario di inizio deve precedere l'orario di fine");
            DisponibilitaMedico disponibilitaMedico = new()
            {
                Giorno = registrazione.Giorno,
                MedicoId = registrazione.MedicoId,
                OraInizio = registrazione.OraInizio,
                OraFine = registrazione.OraFine,
                Data = registrazione.Data,
                Disponibile = registrazione.Disponibile,
            };
            _context.DisponibilitaMedici.Add(disponibilitaMedico);
            await _context.SaveChangesAsync();
            return Created();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Amministratore,Medico")]
        public async Task<IActionResult> Delete(int id)
        {
            DisponibilitaMedico? existingDisponibilitaMedico;
            if (User.IsInRole("Amministratore"))
                existingDisponibilitaMedico = await _context.DisponibilitaMedici.FindAsync(id);
            else
            {
                int idUtenteLoggato = User.IdUtenteLoggato();
                existingDisponibilitaMedico = await _context.DisponibilitaMedici.FirstOrDefaultAsync(m => m.Id == id && m.MedicoId == idUtenteLoggato);
            }

            if (existingDisponibilitaMedico == null)
                return NotFound();

            _context.DisponibilitaMedici.Remove(existingDisponibilitaMedico);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
