using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace Mrie.Services.BinaryProvider.Providers.GitHub;

public abstract class GitHubBinary : Binary
{
    public abstract string RepositoryOwner { get; }
    public abstract string RepositoryName { get; }
    public virtual Dictionary<OSPlatform, string> AssetNames => new()
    {
        { OSPlatform.Windows, BinaryFile },
        { OSPlatform.Linux, BinaryFile }
    };
    public virtual string AssetName => GetPlatformDependant(AssetNames);
    public string AssetPath => Path.Combine(BinaryFolder, AssetName);
    protected static HttpClient HttpClient = new()
    {
        DefaultRequestHeaders = {
            UserAgent = { new ProductInfoHeaderValue("Mrie", "1.0") }
        }
    };

    public override void Install()
    {
        if (IsInstalled)
            return;
        try
        {
            var prefix = Version == "latest" ? "" : $"tags/";
            using (var response = HttpClient.GetAsync($"https://api.github.com/repos/{RepositoryOwner}/{RepositoryName}/releases/{prefix}{Version}").ConfigureAwait(false).GetAwaiter().GetResult())
            {
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine(response.Content.ReadAsStringAsync().Result);
                    Console.WriteLine($"Failed to fetch release: {response.StatusCode}");
                    return;
                }

                var strRelease = response.Content.ReadAsStringAsync().ConfigureAwait(false).GetAwaiter().GetResult();
                var release = JsonSerializer.Deserialize<Release>(strRelease);
                if (release == null || release.Assets == null || release.Assets.Length == 0)
                {
                    Console.WriteLine($"Release or assets are null or empty.\n{strRelease}");
                    return;
                }
                var asset = release.Assets.FirstOrDefault(a => a.Name.Equals(AssetName, StringComparison.OrdinalIgnoreCase));
                if (asset == null)
                {
                    Console.WriteLine($"No asset found with name {AssetName} in release {release.TagName}");
                    return;
                }

                DownloadAsset(asset.Id, AssetPath);

            }
        }
        catch (Exception e)
        {
            Console.WriteLine("An error occurred while trying to install the binary: " + e.Message);
        }
    }

    private static void SetPermission(string path)
    {
#pragma warning disable CA1416 // Validate platform compatibility
        File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute |
            UnixFileMode.GroupRead | UnixFileMode.GroupWrite | UnixFileMode.GroupExecute);
#pragma warning restore CA1416 // Validate platform compatibility
    }

    private bool DownloadAsset(int id, string path)
    {
        if (File.Exists(path))
            return true;

        var header = new MediaTypeWithQualityHeaderValue("application/octet-stream");
        HttpClient.DefaultRequestHeaders.Accept.Add(header);

        var content = HttpClient.GetAsync($"https://api.github.com/repos/{RepositoryOwner}/{RepositoryName}/releases/assets/{id}").ConfigureAwait(false).GetAwaiter().GetResult();
        if (content.IsSuccessStatusCode)
        {
            using (Stream assetStream = content.Content.ReadAsStreamAsync().ConfigureAwait(false).GetAwaiter().GetResult())
            {
                using (FileStream fileStream = File.Create(path))
                    assetStream.CopyToAsync(fileStream).ConfigureAwait(false).GetAwaiter().GetResult();

                Console.WriteLine("Downloaded successfully!");
            }
        }
        else
        {
            Console.Error.WriteLine($"Unsuccessful status code: [{content.StatusCode}]");
            return false;
        }

        HttpClient.DefaultRequestHeaders.Accept.Remove(header);

        if (Environment.OSVersion.Platform == PlatformID.Unix)
            SetPermission(path);

        return false;
    }
}