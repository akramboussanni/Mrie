using Mrie.Services.BinaryProvider.Providers.GitHub;
using System.IO.Compression;
using System.Runtime.InteropServices;

namespace Mrie.Services.BinaryProvider.Binaries;

public class SpotDlBinary : GitHubBinary
{
    public override string Name => "spotdl";
    public override string Version => "v4.2.11";
    public override Dictionary<OSPlatform, string> BinaryFiles { get; } = new()
    {
        { OSPlatform.Windows, "spotdl-4.2.11-win32.exe" },
        { OSPlatform.Linux, "spotdl-4.2.11-linux" }
    };

    public override string RepositoryOwner => "spotDL";
    public override string RepositoryName => "spotify-downloader";


}