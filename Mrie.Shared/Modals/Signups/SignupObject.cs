using Mrie.Shared.Modals.ConditionalAuth;

namespace Mrie.Shared.Modals.Signups;

public class SignupObject : ConditionalAuthObject
{
    public string Id { get; set; } = "TEMPORARY";
    public string DisplayName { get; set; } = "Loading";
    public List<SignupCategory> Categories { get; set; } = [];

    private static readonly SignupObject DefaultObject = new() { Id = "_", DisplayName = "Loading...", Categories = [], AuthorizedUsers = []};

    public static SignupObject CreateDefault()
        => DefaultObject;
}
