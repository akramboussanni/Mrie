using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Mrie.Components.Controllers;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Controllers.Generic;

[ApiController]
[Route("api/v2/settings")]
public class SettingsController : MrieController
{
    public SettingsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context, userManager)
    {
    }

    [HttpPut]
    public async Task<ActionResult> ChangeSettings(AppSettings newSettings)
    {
        if (!await HasPermission(PermissionType.ManageApps))
            return Forbid();

        var settings = await _context.GetSettingsAsync();
        settings.DefaultMasjid = newSettings.DefaultMasjid;
        await _context.SaveChangesAsync();
        return Ok();
    }
    
    [HttpGet]
    public async Task<ActionResult> GetSettings()
    {
        if (!await HasPermission(PermissionType.ManageApps))
            return Forbid();

        var settings = await _context.GetSettingsAsync();
        return Ok(new AppSettings
        {
            DefaultMasjid = settings.DefaultMasjid,
        });
    }
}