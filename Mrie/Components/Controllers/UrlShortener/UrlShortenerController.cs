using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mrie.Components.Controllers;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Components.Controllers.UrlShortener;

[ApiController]
[Route("api/v2/urlshorteners")]
public class UrlShortenerController : CrudController<UrlShortenerObject, string>
{
    public UrlShortenerController(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context, userManager)
    {
    }

    protected override PermissionType GeneralRequiredPermission => PermissionType.UrlShortener;

    protected override UrlShortenerObject PreCreate(UrlShortenerObject input)
    {
        input.Id = Guid.NewGuid().ToString();
        return input;
    }

    private async Task<bool> IsValidAsync(UrlShortenerObject obj)
        => Regex.IsMatch(obj.Name, @"^[a-zA-Z0-9_-]+$") && !await _dbSet.AnyAsync(x => x.Name == obj.Name && x.Id != obj.Id);

    protected override async Task OnUpdateAsync(UrlShortenerObject entity, UrlShortenerObject existing, ApplicationUser? user)
    {
        if (!await IsValidAsync(entity))
            throw new OperationRejectedException("A URL with this name already exists or the name is invalid.");
    }

    protected override async Task<CreateResponseData<UrlShortenerObject, UrlShortenerObject>?> OnCreateAsync(UrlShortenerObject entity, ApplicationUser? user)
    {
        if (!await IsValidAsync(entity))
            throw new OperationRejectedException("A URL with this name already exists or the name is invalid.");

        return null;
    }
}