using System.Text.RegularExpressions;
using Mrie.Services.RegistererService;
using Mrie.Shared.Modals.Downloader;

namespace Mrie.Components.Downloader.Providers;

public abstract class BaseDownloader
{
    public abstract bool IsDefault { get; }
    public virtual bool DoesThisBelong(string content)
        => false;

    public abstract Task<string> Download(string content, MediaType type, MediaInfo? info = null, string requestedPath = "output");
    public abstract Task<MediaInfo> GetInfo(string content);

    private static readonly Regex UrlRegex = new(
        @"^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public static bool IsValidUrl(string input, out Uri sanitizedUrl)
    {
        sanitizedUrl = null;

        if (string.IsNullOrWhiteSpace(input))
            return false;

        input = input.Trim();

        // Basic pattern match
        if (!UrlRegex.IsMatch(input))
            return false;

        // Parse & validate format
        if (Uri.TryCreate(input, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
            sanitizedUrl = uri;
            return true;
        }

        return false;
    }

    public static BaseDownloader FindBestMatch(string content)
    {
        BaseDownloader? bestDownloader = null;
        BaseDownloader? defaultDownloader = null;
        DownloaderRegisterer registerer = (DownloaderRegisterer)BaseRegisterer.Registerers["downloader"];

        foreach (var downloader in registerer.Registered)
        {
            if (downloader.Value.IsDefault)
            {
                defaultDownloader = downloader.Value;
                continue;
            }

            if (downloader.Value.DoesThisBelong(content))
                bestDownloader = downloader.Value;
        }

        bestDownloader ??= defaultDownloader ?? throw new InvalidOperationException("No downloader available. Please set one as the default.");
        return bestDownloader;
    }

    // This event isn't a good idea.
    // I will rework this at a later date :)
    public delegate Task Progress(string url, string message);
    public event Progress Progressed;

    protected async Task InvokeProgress(string url, string message)
    {
        if (Progressed != null)
        {
            var invocationList = Progressed.GetInvocationList();
            foreach (Progress handler in invocationList)
            {
                await handler(url, message);
            }
        }
    }
}