using System;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Mrie.Components.Controllers;
using Mrie.Services.BinaryProvider;
using Mrie.Services.BinaryProvider.Binaries;
using Mrie.Shared.Modals.Downloader;

namespace Mrie.Components.Downloader.Providers;

public class YtDlpDownloader : BaseDownloader
{
    public override bool IsDefault => true;

    public override async Task<string> Download(string content, MediaType type, MediaInfo? info = null, string requestedPath = "output")
    {
        if (!IsValidUrl(content, out var url))
            throw new OperationRejectedException("Invalid URL");

        if (!Binary.TryGetBinary("yt-dlp", out var binary))
            throw new OperationRejectedException("yt-dlp binary not found or not installed.");

        var argsBuilder = new StringBuilder();

        argsBuilder.Append($"\"{url.AbsoluteUri}\" ");
        argsBuilder.Append($"--no-playlist --no-cache-dir --no-progress --ffmpeg-location \"{Binary.GetBinary("ffmpeg").BinaryPath}\" ");

        Environment.SetEnvironmentVariable("TEMP", Path.GetTempPath());
        Environment.SetEnvironmentVariable("TMP", Path.GetTempPath());

        if (type == MediaType.AudioOnly)
            argsBuilder.Append("-f bestaudio -x --audio-format mp3 --audio-quality 0 ");
        else
            argsBuilder.Append("-f bestvideo+bestaudio/best ");

        Directory.CreateDirectory(requestedPath);
        var id = GenerateShortId();
        string name = $"{id}_%(title)s";

        if (info != null)
            name = $"{info.Extractor} - {info.Title} - {type}";

        string outputPath = Path.Combine(requestedPath, name);
        argsBuilder.Append($"-o \"{outputPath}.%(ext)s\"");

        await InvokeProgress(content, "Starting download...");

        StringBuilder err = new();
        var exitCode = await binary.RunAsync(
            argsBuilder.ToString(),
            onOutput: async line => await InvokeProgress(content, $"yt-dlp: {line}"),
            onError: line => err.AppendLine(line)
        );

        if (exitCode != 0)
            throw new OperationRejectedException($"yt-dlp exited with code {exitCode}, error {err}\nArgs: {argsBuilder}");

        return info == null ? id : name;
    }

    private string GenerateShortId(int length = 5)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var data = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(data);
        return new string(data.Select(b => chars[b % chars.Length]).ToArray());
    }


    public override async Task<MediaInfo> GetInfo(string content)
    {
        if (!IsValidUrl(content, out var url))
            throw new OperationRejectedException($"Invalid URL: {content}");

        if (!Binary.TryGetBinary("yt-dlp", out var binary))
            throw new OperationRejectedException("yt-dlp binary not found or not installed.");

        var args = $"--dump-single-json \"{url.AbsoluteUri}\"";

        var outputBuilder = new StringBuilder();
        var errorBuilder = new StringBuilder();

        int exitCode = await binary.RunAsync(
            args,
            onOutput: line => outputBuilder.AppendLine(line),
            onError: line => errorBuilder.AppendLine(line)
        );

        if (exitCode != 0)
        {
            var errorMsg = errorBuilder.ToString();
            throw new OperationRejectedException($"yt-dlp exited with code {exitCode}. Error: {errorMsg}");
        }

        var json = outputBuilder.ToString();
        if (string.IsNullOrWhiteSpace(json))
            throw new OperationRejectedException("yt-dlp returned empty info.");

        try
        {
            var mediaInfo = JsonSerializer.Deserialize<MediaInfo>(json, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
            return mediaInfo ?? throw new OperationRejectedException("Failed to deserialize media info.");
        }
        catch (JsonException ex)
        {
            throw new OperationRejectedException("Error deserializing media info JSON.");
        }
    }
}
