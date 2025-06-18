using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Mrie.Components.Controllers;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Controllers.Generic;

[ApiController]
[Route("api/v2/permissions")]
public class PermissionsController : MrieController
{
    public PermissionsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context, userManager)
    {
    }

    [HttpGet("{permission}")]
    public async Task<ActionResult<bool>> GetAuthorized([FromRoute] PermissionType permission)
        => await HasPermission(permission);

    [HttpPatch]
    public async Task<ActionResult> Authorize(AuthorizationRequest request)
    {
        var (authorized, user) = await UserHasPermission(PermissionType.ManageUsers);
        if (!authorized || user == null) // tokens are not allowed to access this endpoint for security reasons
            return Forbid();

        var foundUser = await _userManager.FindByEmailAsync(request.Email);
        if (foundUser == null)
            return NotFound();

        if (!user.HasPermission(request.Permissions))
            return Forbid();

        if (request.Substract)
        {
            foundUser.Permissions &= ~request.Permissions;
        }
        else
        {
            foundUser.Permissions |= request.Permissions;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}