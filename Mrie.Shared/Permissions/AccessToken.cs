using System.Security.Cryptography;
using System.Text.Json.Serialization;

namespace Mrie.Shared.Permissions;

public class AccessToken
{
    public string? Id { get; set; }
    [JsonIgnore]
    public string? HashedToken { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? Expiration { get; set; }
    public bool IsActive { get; set; }
    public string? Description { get; set; }
    public IEnumerable<PermissionType> Permissions { get; set; } = new List<PermissionType>();

    public string GenerateToken()
    {
        Id = Guid.NewGuid().ToString();
        using var rng = RandomNumberGenerator.Create();
        var randomBytes = new byte[16];
        rng.GetBytes(randomBytes);

        var raw = Convert.ToBase64String(randomBytes);
        HashedToken = Convert.ToBase64String(SHA256.HashData(randomBytes));
        return raw;
    }

    public AccessToken(string name, DateTime expiration, bool isActive, string? description = null)
    {
        Name = name;
        Expiration = expiration;
        IsActive = isActive;
        Description = description;
    }
    public AccessToken()
    {
    }

    public bool HasPermission(PermissionType permission)
    {
        return DateTime.UtcNow < Expiration || Permissions.Contains(permission) || Permissions.Contains(PermissionType.Admin);
    }
}