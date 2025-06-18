using Mrie.Shared.Permissions;

namespace Mrie.Shared.Modals;

public class AuthorizationRequest
{
    public string Email { get; set; }
    public PermissionType Permissions{get;set;}
    public bool Substract { get; set; } = false;
}