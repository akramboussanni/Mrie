using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Mrie.Components.Controllers;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Components.Controllers.AccessTokens;

[ApiController]
[Route("api/v2/tokens")]
public class AccessTokensController : CrudController<AccessToken, string, string>
{
    public AccessTokensController(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context, userManager)
    {
    }

    protected override bool AllowAccessTokens => false;

    /// <inheritdoc/>
    protected override AccessToken PreAll(AccessToken input)
    {
        input.HashedToken = "";
        return input;
    }

    protected override AccessToken PreCreate(AccessToken input)
    {
        input.Id = Guid.NewGuid().ToString();
        return PreAll(input);
    }

    /// <inheritdoc/>
    protected override AccessToken PreUpdate(AccessToken input, AccessToken original)
    {
        return new AccessToken
        {
            Id = original.Id, // not actually useless!
            Name = input.Name,
            Description = input.Description,
            Expiration = input.Expiration,
            IsActive = input.IsActive
        };
    }

    /// <inheritdoc/>
    protected override IQueryable<AccessToken> GetAllQueryable() => _dbSet.Select(x => new AccessToken
    {
        Description = x.Description,
        Id = x.Id,
        Name = x.Name,
        Expiration = x.Expiration,
        IsActive = x.IsActive,
        Permissions = x.Permissions
    });

    protected override string GetId(AccessToken entity) => entity.Id;

    /// <inheritdoc/>
    protected override PermissionType GeneralRequiredPermission => PermissionType.ManageApps;

    /// <inheritdoc/>
    protected override Task<CreateResponseData<AccessToken, string>> OnCreateAsync(AccessToken entity, ApplicationUser? user)
    {
        if (user == null)
            throw new OperationRejectedException("User cannot be null during token creation.");

        foreach (var permission in entity.Permissions)

            if (!user.HasPermission(permission))
                throw new OperationRejectedException($"User does not have permission: {permission}");

        var raw = entity.GenerateToken();
        return Task.FromResult(new CreateResponseData<AccessToken, string>(entity, raw));
    }
}