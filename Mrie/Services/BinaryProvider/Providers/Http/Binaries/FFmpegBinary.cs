using Mrie.Services.BinaryProvider.Providers.Http;
using SharpCompress.Archives;
using SharpCompress.Archives.SevenZip;
using SharpCompress.Readers;
using System.IO.Compression;
using System.Runtime.InteropServices;

namespace Mrie.Services.BinaryProvider.Binaries;

public class FFmpegBinary : HttpBinary
{
    public override string Name => "ffmpeg";
    public override Dictionary<OSPlatform, string> BinaryFiles { get; } = new()
    {
        { OSPlatform.Windows, "ffmpeg.exe" },
        { OSPlatform.Linux, "ffmpeg" }
    };
    public override string SaveAs => "ffmpeg-git-essentials.7z";
    public override string Version => "latest";

    public override Dictionary<OSPlatform, string> Urls { get; } = new()
    {
        { OSPlatform.Windows, "https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-essentials.7z" },
        { OSPlatform.Linux, "ffmpeg" } // Linux auto-installation is currently unsupported. Please download manually. I am not coding allat
    };

    private readonly string[] RequiredMovedFiles = ["ffmpeg.exe", "ffprobe.exe", "ffplay.exe"];
    public override void Install()
    {
        if (IsInstalled)
            return;

        base.Install();
        string extractPath = Path.Combine(BinaryFolder, "temp_ffmpeg");

        if (Directory.Exists(extractPath))
            Directory.Delete(extractPath, true);

        using var archive = SevenZipArchive.Open(SavedTo);
        foreach (var entry in archive.Entries.Where(e => !e.IsDirectory))
            entry.WriteToDirectory(extractPath, new ExtractionOptions { ExtractFullPath = true, Overwrite = true });

        foreach (var requiredFile in RequiredMovedFiles)
        {
            string ffmpegExePath = "";
            foreach (var file in Directory.GetFiles(extractPath, requiredFile, SearchOption.AllDirectories))
            {
                ffmpegExePath = file;
                break;
            }

            if (ffmpegExePath == "")
            {
                Console.WriteLine($"{requiredFile} not found.");
                return;
            }

            string destPath = BinaryPath;
            File.Copy(ffmpegExePath, destPath, true);
            Console.WriteLine($"{requiredFile} moved to: {destPath}");
        }


        Directory.Delete(extractPath, true);
        File.Delete(SavedTo);
    }
}