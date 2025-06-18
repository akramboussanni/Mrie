using Microsoft.AspNetCore.Identity;
using Mrie.Shared.Permissions;

namespace Mrie.Data;

// Add profile data for application users by adding properties to the ApplicationUser class
public class ApplicationUser : IdentityUser
{
    public bool IsAdmin => Permissions.HasFlag(PermissionType.Admin);
    public PermissionType Permissions { get; set; }
    public bool HasPermission(PermissionType permission)
        => Permissions.HasFlag(permission) ||  Permissions.HasFlag(PermissionType.Admin);
}