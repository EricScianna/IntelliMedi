namespace IntelliMedi.API.Controllers;

using IntelliMedi.API.Data;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PazientiController : ControllerBase
{
    private readonly AppDbContext _context;

    public PazientiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Amministratore")]
    public async Task<ActionResult<IEnumerable<Paziente>>> GetAll()
    {
        return await _context.Pazienti.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Paziente>> GetById(int id)
    {
        var paziente = await _context.Pazienti.FindAsync(id);
        if (paziente == null)
            return NotFound();
        return paziente;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<Paziente>> Create(RegistrazioneRequest registrazione)
    {
        if (_context.Pazienti.Any(p => p.Username == registrazione.Username))
            return BadRequest();

        Paziente paziente = new Paziente
        {
            Nome = registrazione.Nome,
            Cognome = registrazione.Cognome,
            Sesso = registrazione.Sesso,
            DataNascita = registrazione.DataNascita,
            CodiceFiscale = registrazione.CodiceFiscale,
            Username = registrazione.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(registrazione.Password)
        };

        _context.Pazienti.Add(paziente);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = paziente.Id }, paziente);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ModificaAnagraficaRequest modifica)
    {
        var idUtenteLoggato = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (idUtenteLoggato != id.ToString())
        {
            return Forbid();
        }
        var existingPaziente = await _context.Pazienti.FindAsync(id);
        if (existingPaziente == null)
        {
            return NotFound();
        }
        
        existingPaziente.Nome = modifica.Nome;
        existingPaziente.Cognome = modifica.Cognome;
        existingPaziente.CodiceFiscale = modifica.CodiceFiscale;
        existingPaziente.DataNascita = modifica.DataNascita;
        existingPaziente.Sesso = modifica.Sesso;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existingPaziente = await _context.Pazienti.FindAsync(id);
        if (existingPaziente == null)
        {
            return NotFound();
        }

        _context.Pazienti.Remove(existingPaziente);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}