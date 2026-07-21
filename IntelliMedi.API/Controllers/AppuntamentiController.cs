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
        [HttpGet("CalendarioPerTipologia")]
        [Authorize(Roles = "Amministratore,Paziente")]
        public async Task<ActionResult<IEnumerable<CalendarioResponse>>> CalendarioPerTipologia(int tipologiaId, int? pazienteId)
        {
            if (User.IsInRole("Paziente") && (User.IdUtenteLoggato() != pazienteId)) return Forbid();
            if (pazienteId == null) return BadRequest("Selezionare un paziente");

            int pazienteRiferimento;
            if (User.IsInRole("Paziente"))
                pazienteRiferimento = User.IdUtenteLoggato();
            else
                pazienteRiferimento = pazienteId.Value;

            return await _context.Appuntamenti
            .Where(d => d.Medico.TipologiaVisite
            .Any(x => x.Id == tipologiaId))
            .Select(t => new CalendarioResponse
            {
                Mio = t.PazienteId == pazienteRiferimento,
                Id = t.PazienteId == pazienteRiferimento ? t.Id : null,
                Data = t.Data,
                MedicoId = t.MedicoId
            })
            .ToListAsync();
        }

        [HttpGet("CalendarioPerMedico")]
        [Authorize(Roles = "Amministratore,Paziente")]
        public async Task<ActionResult<IEnumerable<CalendarioResponse>>> CalendarioPerMedico(int medicoId, int? pazienteId)
        {
            if (User.IsInRole("Paziente") && (User.IdUtenteLoggato() != pazienteId)) return Forbid();
            if (pazienteId == null) return BadRequest("Selezionare un paziente");

            int pazienteRiferimento;
            if (User.IsInRole("Paziente"))
                pazienteRiferimento = User.IdUtenteLoggato();
            else
                pazienteRiferimento = pazienteId.Value;

            return await _context.Appuntamenti
            .Where(d => d.MedicoId == medicoId)
            .Select(t => new CalendarioResponse
            {
                Mio = t.PazienteId == pazienteRiferimento,
                Id = t.PazienteId == pazienteRiferimento ? t.Id : null,
                Data = t.Data,
                MedicoId = t.MedicoId
            })
            .ToListAsync();
        }

        [HttpGet("GetByPaziente")]
        [Authorize(Roles = "Amministratore,Paziente")]
        public async Task<ActionResult<IEnumerable<AppuntamentoResponse>>> GetByPaziente(int pazienteId)
        {
            if (User.IsInRole("Paziente") && (User.IdUtenteLoggato() != pazienteId)) return Forbid();

            //LINQ usa where per filtrare gli elementi di appuntamenti con:
            //pazienteId uguale a quella ricevuta
            return await _context.Appuntamenti
            .Where(d => d.PazienteId == pazienteId)
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        [HttpGet("GetByMedico")]
        [Authorize(Roles = "Amministratore,Medico")]
        public async Task<ActionResult<IEnumerable<AppuntamentoResponse>>> GetByMedico(int medicoId)
        {
            if (User.IsInRole("Medico") && (User.IdUtenteLoggato() != medicoId)) return Forbid();

            //LINQ usa where per filtrare gli elementi di appuntamenti con:
            //medicoId uguale a quella ricevuta
            return await _context.Appuntamenti
            .Where(d => d.MedicoId == medicoId)
            .Select(ProiezioneResponse)
            .ToListAsync();
        }

        [HttpPost]
        [Authorize(Roles = "Amministratore,Paziente")]
        public async Task<IActionResult> Create(AppuntamentoRequest registrazione)
        {
            if (registrazione.Data < DateTime.Now) return BadRequest("Non è possibile prenotare su una data passata");
            if (User.IsInRole("Paziente") && (User.IdUtenteLoggato() != registrazione.PazienteId)) return Forbid();
            if (!await _context.TipologieVisita.AnyAsync(d => d.Id == registrazione.TipologiaVisitaId && d.Medici.Any(x => x.Id == registrazione.MedicoId))) return BadRequest("Il medico selezionato non esercita la tipologia richiesta");

            //lo slot rientra nella disponibilità di quel medico? (giorno-settimana + ora);
            var disponibilita = await _context.DisponibilitaMedici.Where(d => d.MedicoId == registrazione.MedicoId).ToListAsync();

            var dataApp = DateOnly.FromDateTime(registrazione.Data);
            var oraApp = registrazione.Data.Hour;

            // coperto: disponibilità positiva (one-off sulla data, o ricorrente sul giorno-settimana) nell'ora giusta
            var coperto = disponibilita.Any(d => d.Disponibile
                && d.OraInizio.Hour <= oraApp && d.OraFine.Hour > oraApp
                && (d.Data == dataApp || (d.Data == null && d.Giorno == registrazione.Data.DayOfWeek)));

            // eccezione: record "non disponibile" per quella data/ora
            var eccezione = disponibilita.Any(d => !d.Disponibile && d.Data == dataApp
                && d.OraInizio.Hour <= oraApp && d.OraFine.Hour > oraApp);

            if (!coperto || eccezione) return BadRequest("Slot fuori dalla disponibilità del medico");

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
            return Created();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            Appuntamento? existingAppuntamento;
            if (User.IsInRole("Amministratore"))
                existingAppuntamento = await _context.Appuntamenti.FindAsync(id);
            else if (User.IsInRole("Medico"))
            {
                int idUtenteLoggato = User.IdUtenteLoggato();
                existingAppuntamento = await _context.Appuntamenti.FirstOrDefaultAsync(m => m.Id == id && m.MedicoId == idUtenteLoggato);
            }
            else
            {
                int idUtenteLoggato = User.IdUtenteLoggato();
                existingAppuntamento = await _context.Appuntamenti.FirstOrDefaultAsync(m => m.Id == id && m.PazienteId == idUtenteLoggato);
            }

            if (existingAppuntamento == null)
                return NotFound();


            _context.Appuntamenti.Remove(existingAppuntamento);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
