using System.Security.Claims;

namespace IntelliMedi.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int IdUtenteLoggato(this ClaimsPrincipal user) =>
            int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
