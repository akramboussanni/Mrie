using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Mrie.Data;
using Mrie.Services;
using Mrie.Shared.Modals;
using Mrie.Shared.Modals.LabRador;
using Mrie.Shared.Modals.LabRador.Results;
using Mrie.Shared.Permissions;
using OpenAI.Chat;

namespace Mrie.Components.LabRador;

[ApiController]
[Route("api/[controller]")]
public class LabRadorController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly OpenAIService _gpt;
    private readonly IHubContext<LabRadorHub> _hub;
    private readonly IServiceScopeFactory _scopeFactory;

    public LabRadorController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, OpenAIService gpt,
        IHubContext<LabRadorHub> hub, IServiceScopeFactory scopeFactory)
    {
        _scopeFactory  = scopeFactory;
        _context = context;
        _userManager = userManager;
        _gpt = gpt;
        _hub = hub;
    }

    [HttpGet("getsettings")]
    [Authorize]
    public async Task<ActionResult> GetSettings()
    {
        var (allowed, user) = await _userManager.CheckNullAndPermission(User, PermissionType.ManageApps);
        if (!allowed)
            return Forbid();

        return Ok(await _context.GetSettingsAsync());
    }
    
    [HttpGet("charlimit")]
    public async Task<ActionResult> GetCharacterLimit()
    {
        return Ok((await _context.GetSettingsAsync()).LabRadorCharacterLimit);
    }
    
    [HttpGet("instrcharlimit")]
    public async Task<ActionResult> GetInstructionCharacterLimit()
    {
        return Ok((await _context.GetSettingsAsync()).LabRadorInstructionCharacterLimit);
    }

    [HttpPost("resetsettings")]
    [Authorize]
    public async Task<ActionResult> ResetSettings()
    {
        var (allowed, user) = await _userManager.CheckNullAndPermission(User, PermissionType.ManageApps);
        if (!allowed)
            return Forbid();
        
        _context.SettingsSet.RemoveRange(_context.SettingsSet);
        await Extensions.CreateDefaultSettings(_context);
        return Ok();
    }

    [HttpPost("changesettings")]
    [Authorize]
    public async Task<ActionResult> SetLimit(AppSettings newSettings)
    {
        var (allowed, user) = await _userManager.CheckNullAndPermission(User, PermissionType.ManageApps);
        if (!allowed)
            return Forbid();

        var settings = await _context.GetSettingsAsync();
        settings.LabRadorDailyLimit = newSettings.LabRadorDailyLimit;
        settings.LabRadorCharacterLimit = newSettings.LabRadorCharacterLimit;
        settings.LabRadorInstructionCharacterLimit = newSettings.LabRadorInstructionCharacterLimit;
        settings.LabRadorInstructionBase = newSettings.LabRadorInstructionBase;
        settings.LabRadorAnalyseResultatInstruction =  newSettings.LabRadorAnalyseResultatInstruction;
        settings.LabRadorAnalyseDemarcheInstruction  =  newSettings.LabRadorAnalyseDemarcheInstruction;
        settings.LabRadorConclusionInstruction = newSettings.LabRadorConclusionInstruction;
        settings.LabRadorErrorFinderInstruction = newSettings.LabRadorErrorFinderInstruction;
        await _context.SaveChangesAsync();
        return Ok(settings);
    }

    [HttpPost("generate")]
    [Authorize]
    public async Task<ActionResult<LabRadorResponse>> RequestGeneration(LabRadorRequest req)
    {
        var (authorized, _) = await _userManager.CheckNullAndPermission(User, PermissionType.LabRador);
        if (!authorized)
            return Forbid();

        var settings = await _context.GetSettingsAsync();
        if (req.LabReport.Length > settings.LabRadorCharacterLimit || req.ExtraInstructions.Length > settings.LabRadorInstructionCharacterLimit)
            return BadRequest("Too many characters.");

        if (req is
            {
                GenerateAnalyseResultats: false, GenerateAnalyseDemarche: false, GenerateConclusion: false,
                GenerateMistakeFinder: false, GenerateCalculs: false
            })
            return BadRequest("Select at least 1 option to generate.");
        
        // Pretend I checked for daily limits.
        string id = Guid.NewGuid().ToString();
        LabRadorResponse response = new ()
        {
            Id = id,
            Delta = "",
            State = LabRadorState.Thinking
        };
        
        await _context.LabRadorGenerations.AddAsync(response);
        await _context.SaveChangesAsync();
        _ = Task.Run(async () =>
        {
            try
            {
                await SendResponse(req, id);
            }
            catch (Exception ex)
            {
                // Log error here (e.g., using ILogger)
                await Console.Error.WriteLineAsync($"SendResponse failed: {ex.Message}\n{ex.StackTrace}");
            }
        });
        return Ok(id);
    }

    [HttpPut("authorize")]
    [Authorize]
    public async Task<ActionResult<bool>> AuthorizeUser(string email)
    {
        var (authorized, user) = await _userManager.CheckNullAndPermission(User, PermissionType.ManageUsers);
        if (!authorized)
            return Forbid();

        var foundUser = await _userManager.FindByEmailAsync(email);
        if (foundUser == null)
            return NotFound();

        if (foundUser.Permissions.HasFlag(PermissionType.LabRador))
        {
            foundUser.Permissions &=  ~PermissionType.LabRador;
            await _context.SaveChangesAsync();
            return Ok(false);
        }
        
        foundUser.Permissions |= PermissionType.LabRador;
        await _context.SaveChangesAsync();
        return Ok(true);
    }
    
    [HttpGet("generation")]
    public async Task<ActionResult<LabRadorResponse>> GetGeneration([FromQuery] string id)
    {
        Console.WriteLine($"Requested {id} LabRador generation");
        var response = await _context.LabRadorGenerations.FirstOrDefaultAsync(x => x.Id == id);
        if (response == null)
            return NotFound();

        return Ok(response);
    }

    public async Task SendResponse(LabRadorRequest req, string id)
    {
        using var scope   = _scopeFactory.CreateScope();
        var   context     = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var   gpt         = scope.ServiceProvider.GetRequiredService<OpenAIService>();
        var   hub         = scope.ServiceProvider.GetRequiredService<IHubContext<LabRadorHub>>();
        
        LabRadorResponse obj;
        await foreach (var response in gpt.StreamResponseAsync(req))
        {
            obj = await context.LabRadorGenerations.FirstAsync(x => x.Id == id);
            var labResponse = ParseResponse(response);
            obj.Delta += labResponse.Delta;
            obj.State = labResponse.State;
            if (LabRadorHub.LabRadorMapping.TryGetValue(id, out var subscribed))
            {
                foreach (var user in subscribed)
                    await _hub.Clients.Client(user).SendAsync("ReceiveResponsePart", labResponse);
            }
            await context.SaveChangesAsync();
        }
        
        obj = await context.LabRadorGenerations.FirstAsync(x => x.Id == id);
        obj.State = LabRadorState.Completed;
        if (LabRadorHub.LabRadorMapping.TryGetValue(id, out var subscribed2))
        {
            foreach (var user in subscribed2)
                await _hub.Clients.Client(user).SendAsync("ReceiveResponsePart", new LabRadorResponse { State = LabRadorState.Completed, Delta = ""});
        }

        LabRadorHub.LabRadorMapping.Remove(id);
        await context.SaveChangesAsync();
    }
    
    private LabRadorResponse ParseResponse(StreamingChatCompletionUpdate update)
    {
        if (update.ContentUpdate.Count > 0)
            return new() { Delta = string.Join("", update.ContentUpdate.Select(x => x.Text)), State = LabRadorState.Generating };

        return new() { Delta = "", State = LabRadorState.Thinking };
    }
}