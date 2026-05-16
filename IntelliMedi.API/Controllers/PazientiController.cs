namespace IntelliMedi.API.Controllers;

using IntelliMedi.API.Data;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    public async Task<ActionResult<Paziente>> Create(Paziente paziente)
    {
        paziente.PasswordHash = BCrypt.Net.BCrypt.HashPassword(paziente.PasswordHash);
        _context.Pazienti.Add(paziente);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = paziente.Id }, paziente);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Paziente paziente)
    {
        if (id != paziente.Id)
            return BadRequest();

        var existingPaziente = await _context.Pazienti.FindAsync(id);
        if (existingPaziente == null)
        {
            return NotFound();
        }

        existingPaziente.Nome = paziente.Nome;
        existingPaziente.Cognome = paziente.Cognome;
        existingPaziente.CodiceFiscale = paziente.CodiceFiscale;
        existingPaziente.DataNascita = paziente.DataNascita;
        existingPaziente.Sesso = paziente.Sesso;
        existingPaziente.Username = paziente.Username;
        existingPaziente.PasswordHash = paziente.PasswordHash;

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