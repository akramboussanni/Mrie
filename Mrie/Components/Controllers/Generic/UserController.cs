using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Mrie.Components.Controllers;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Controllers.Generic;

[ApiController]
[Route("api/v2/users")]
public class UserController : MrieController
{
    public UserController(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context, userManager)
    {
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<string>> GetUser([FromRoute] string id)
    {
        if (!await HasPermission(PermissionType.Signups) && !await HasPermission(PermissionType.ManageApps))
            return Forbid();

        var found = await _userManager.FindByIdAsync(id);

        if (found == null)
            return NotFound("Did not find any user with that ID");

        return Ok(found.Email);
    }
    
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<string>> CreateUser([FromBody] AccountCreationPayload payload)
    {
        if (!await HasPermission(PermissionType.ManageUsers))
            return Forbid();

        var existingUser = await _userManager.FindByEmailAsync(payload.Email);
        if (existingUser != null)
            return Conflict("Already exists account with that email.");

        var user = new ApplicationUser
        {
            UserName = payload.Email,
            Email = payload.Email,
            EmailConfirmed = true,
            LockoutEnabled = true,
        };

        var result = await _userManager.CreateAsync(user, payload.Password);
        if (result.Succeeded)
            return NoContent();

        return StatusCode(500, string.Join(", ", result.Errors.Select(x => x.Description)));
    }
}