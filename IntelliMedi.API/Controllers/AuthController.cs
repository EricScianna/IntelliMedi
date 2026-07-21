using IntelliMedi.API.Data;
using IntelliMedi.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace IntelliMedi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        //un'interfaccia fornita da ASP.NET Core che dà accesso ai valori di configurazione dell'applicazione. tutto quello scritto in appsettings.json
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginRequest loginRequest)
        {
            Utente? utente = await _context.Amministratori.FirstOrDefaultAsync(u => u.Username == loginRequest.Username);
            utente ??= await _context.Pazienti.FirstOrDefaultAsync(u => u.Username == loginRequest.Username);
            utente ??= await _context.Medici.FirstOrDefaultAsync(u => u.Username == loginRequest.Username);
            if (utente == null)
            {
                return Unauthorized();
            }

            if (!(BCrypt.Net.BCrypt.Verify(loginRequest.Password, utente.PasswordHash)))
                return Unauthorized();

            var token = GeneraToken(utente);
            return Ok(new
            {
                token,
                utente = new
                {
                    id = utente.Id,
                    ruolo = utente.GetType().Name,
                    nome = utente.Nome,
                    cognome = utente.Cognome
                }
            });
        }
        private string GeneraToken(Utente utente)
        {
            //prende la chiave segreta da appsettings.json e la converte in bytes, entra nella sezione Jwt, restituisce il valore di Key
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            //combina la chiave con l'algoritmo di firma HmacSha256. Questo è l'algoritmo che genera la firma digitale del token
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            //informazioni sull'utente contenute nel token: ID, username, ruolo. Il client li legge dal token senza fare un'altra richiesta al database
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, utente.Id.ToString()),
                new Claim(ClaimTypes.Name, utente.Nome),
                new Claim(ClaimTypes.Surname, utente.Cognome),
                new Claim("username", utente.Username),
                new Claim(ClaimTypes.Role, utente.Ruolo)
            };

            // assembla il token con scadenza 8 ore e firma. Dopo 8 ore il token non sarà più valido e l'utente dovrà rifare il login.
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: credentials
            );

            //serializza il token nell'stringa xxxxx.yyyyy.zzzzz
            //xxxxx = header
            //yyyyy = Payload (claims: id, username, scadenza)
            //zzzzz = firma
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
