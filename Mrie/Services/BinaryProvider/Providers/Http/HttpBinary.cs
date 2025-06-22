using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace Mrie.Services.BinaryProvider.Providers.Http;

public abstract class HttpBinary : Binary
{
    public abstract Dictionary<OSPlatform, string> Urls { get; }
    public string Url => GetPlatformDependant(Urls);

    public virtual Dictionary<OSPlatform, string> SaveAsValues => new()
    {
        { OSPlatform.Windows, BinaryFile },
        { OSPlatform.Linux, BinaryFile }
    };
    public virtual string SaveAs => GetPlatformDependant(SaveAsValues);
    
    public string SavedTo => Path.Combine(BinaryFolder, SaveAs);
    protected static HttpClient HttpClient = new();
    public override void Install()
    {
        if (IsInstalled)
            return;

        var response = HttpClient.GetAsync(Url).ConfigureAwait(false).GetAwaiter().GetResult();
        response.EnsureSuccessStatusCode();

        using var stream = response.Content.ReadAsStream();
        using var fileStream = File.Create(SavedTo);
        stream.CopyTo(fileStream);

        if (Environment.OSVersion.Platform == PlatformID.Unix)
            SetPermission(SavedTo);
    }

//this should probably be in Binary.cs to be honest :p
    protected static void SetPermission(string path)
    {
#pragma warning disable CA1416 // Validate platform compatibility
        File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute |
            UnixFileMode.GroupRead | UnixFileMode.GroupWrite | UnixFileMode.GroupExecute);
#pragma warning restore CA1416 // Validate platform compatibility
    }
}