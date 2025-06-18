using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Components.Controllers;

[ApiController]
public abstract class MrieController : ControllerBase
{
    protected readonly ApplicationDbContext _context;
    protected readonly UserManager<ApplicationUser> _userManager;

    public MrieController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    /// <summary>
    /// This property indicates whether access tokens are allowed to access the API.
    /// If set to false, the API will only allow access through authenticated users.
    /// </summary>
    protected virtual bool AllowAccessTokens => true;

    protected virtual async Task<(bool, ApplicationUser?)> UserHasPermission(PermissionType permission)
    {
        var user = await _userManager.GetUserAsync(User);

        if (permission == PermissionType.None)
        {
            return (true, user);
        }

        if (user == null)
        {
            if (AllowAccessTokens && Request.Headers.TryGetValue("X-Mrie-Token", out var token))
            {
                var bytes = Convert.FromBase64String(token);
                var hashed = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(bytes));
                var accessToken = await _context.AccessTokens
                    .FirstOrDefaultAsync(t => t.HashedToken == hashed && t.IsActive);

                if (accessToken == null)
                    return (false, null);

                return (accessToken.HasPermission(permission), null);
            }

            return (false, null);
        }

        return (user.HasPermission(permission), user);
    }

    protected virtual async Task<bool> HasPermission(PermissionType permission)
        => (await UserHasPermission(permission)).Item1;
}
