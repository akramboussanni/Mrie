using Mrie.Services.BinaryProvider.Providers.GitHub;
using System.IO.Compression;
using System.Runtime.InteropServices;

namespace Mrie.Services.BinaryProvider.Binaries;

public class YtDlpBinary : GitHubBinary
{
    public override string Name => "yt-dlp";
    public override string Version => "latest";
    public override Dictionary<OSPlatform, string> BinaryFiles { get; } = new()
    {
        { OSPlatform.Windows, "yt-dlp.exe" },
        { OSPlatform.Linux, "yt-dlp" },
    };

    public override string RepositoryOwner => "yt-dlp";
    public override string RepositoryName => "yt-dlp";

}