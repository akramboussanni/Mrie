using System.Reflection;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Modals.Signups;
using Mrie.Shared.Permissions;

namespace Mrie.Components;

[ApiController]
[Route("api/[controller]")]
public class SignupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public SignupsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }
    
    [HttpGet("signups")]
    public async Task<ActionResult> GetSignups()
    { 
        ApplicationUser? user = await _userManager.GetUserAsync(User);

        if (user == null)
            return Ok(await _context.Signups.Where(x => !x.RequireAuth).ToListAsync());

        if (user.HasPermission(PermissionType.Signups))
            return Ok(await _context.Signups.ToListAsync());
        
        return Ok(await _context.Signups
            .Where(x => x.AuthorizedUsers.Contains(user.Id)).ToListAsync());
    }
    
    [HttpGet("signup")]
    public async Task<ActionResult<SignupObject>> GetSignup([FromQuery] string id)
    {
        ApplicationUser? user = await _userManager.GetUserAsync(User);

        if (user == null)
            return Ok(await _context.Signups.FirstOrDefaultAsync(x => x.Id == id && !x.RequireAuth));

        if (user.HasPermission(PermissionType.Signups))
            return Ok(await _context.Signups.FirstOrDefaultAsync(x => x.Id == id));
        
        return Ok(await _context.Signups
            .FirstOrDefaultAsync(x => x.AuthorizedUsers.Contains(user.Id) && x.Id == id));
    }

    [HttpDelete("deletesignup")]
    [Authorize]
    public async Task<ActionResult> DeleteSignup([FromQuery] string id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.HasPermission(PermissionType.Signups)) 
            return Forbid();

        var signup = await _context.Signups.FindAsync(id);
        if (signup == null) 
            return NotFound();

        _context.Signups.Remove(signup);
        await _context.SaveChangesAsync();

        return Ok();
    }
    
    [HttpPost("modifysignup")]
    [Authorize]
    public async Task<ActionResult> AddSignup(SignupObject signup)
    {
        // Get the current user and check permissions.
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.HasPermission(PermissionType.Signups))
            return Forbid();

        // Determine if this is an update or a new record.
        var existingSignup = await _context.Signups
            .Include(s => s.Categories)
            .ThenInclude(c => c.Participants)
            .FirstOrDefaultAsync(t => t.Id == signup.Id);

        if (existingSignup != null)
        {
            existingSignup.DisplayName  = signup.DisplayName;
            existingSignup.AuthorizedUsers =  signup.AuthorizedUsers;
            UpdateCategories(existingSignup.Categories, signup.Categories);
            existingSignup.RequireAuth = signup.RequireAuth;
            await _context.SaveChangesAsync();
            return Ok();
        }

        signup.Id = Guid.NewGuid().ToString();
        _context.Signups.Add(signup);
        await _context.SaveChangesAsync();
        return Ok();
    }
    
    private void UpdateCategories(List<SignupCategory> existingCategories, List<SignupCategory> incomingCategories)
    {
        // Remove categories not in incoming list
        foreach (var existingCat in existingCategories.ToList())
        {
            if (incomingCategories.Any(ic => ic.Id == existingCat.Id)) continue;
            existingCategories.Remove(existingCat);
            _context.Remove(existingCat);
        }

        foreach (var incomingCat in incomingCategories)
        {
            var existingCat = existingCategories.FirstOrDefault(ec => ec.Id == incomingCat.Id);
            if (existingCat != null)
            {
                // Update category properties
                _context.Entry(existingCat).CurrentValues.SetValues(incomingCat);
                // Update Participants for this category
                UpdateParticipants(existingCat.Participants, incomingCat.Participants);
            }
            else
            {
                // Add new category (ensure ID is generated if necessary)
                incomingCat.Id = Guid.NewGuid().ToString();
                existingCategories.Add(incomingCat);
            }
        }
        
        
    }

    private void UpdateParticipants(List<CategoryParticipant> existingParticipants, List<CategoryParticipant> incomingParticipants)
    {
        // Remove participants not in incoming list
        foreach (var existingPart in existingParticipants.ToList())
        {
            if (incomingParticipants.Any(ip => ip.Person.Id == existingPart.Person.Id)) continue;
            
            existingParticipants.Remove(existingPart);
            _context.Remove(existingPart);
        }

        foreach (var incomingPart in incomingParticipants)
        {
            var existingPart = existingParticipants.FirstOrDefault(ep => ep.PersonId == incomingPart.PersonId);
            if (existingPart != null)
            {
                // Update participant properties
                _context.Entry(existingPart).CurrentValues.SetValues(incomingPart);
            }
            else
            {
                // Ensure the Person exists or handle creation as needed
                existingParticipants.Add(incomingPart);
            }
        }
    }
}