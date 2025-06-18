namespace Mrie.Shared.Modals.ConditionalAuth;

public class ConditionalAuthObject
{
    public virtual bool RequireAuth { get; set; }
    public List<string> AuthorizedUsers { get; set; } = [];
}