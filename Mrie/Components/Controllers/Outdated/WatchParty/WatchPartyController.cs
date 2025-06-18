using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Components.WatchParty;

[ApiController]
[Route("api/[controller]")]
public class WatchPartyController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly WatchPartyManager _partyManager;

    public WatchPartyController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, WatchPartyManager partyManager)
    {
        _context = context;
        _userManager = userManager;
        _partyManager = partyManager;
    }
    
    [HttpGet("party/{partyId}")]
    public IActionResult GetVideo(string partyId)
    {
        /*var party = _partyManager.GetParty(partyId);
        var stream = new FileStream(party.VideoUrl, FileMode.Open, FileAccess.Read);
        return File(stream, "video/mp4", enableRangeProcessing: true);*/
        return Ok();
    }
}