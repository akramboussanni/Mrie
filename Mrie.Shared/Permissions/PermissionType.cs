namespace Mrie.Shared.Permissions;

[Flags]
public enum PermissionType
{
    None = 0,
    Admin = 2,
    ManageApps = 4,
    ManageUsers = 8,
    Signups = 16,
    UrlShortener = 32,
    LabRador = 64,
    Zorro = 128,
}