using System.Collections.Concurrent;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Mrie.Components.Controllers;
using Mrie.Components.Downloader.Providers;
using Mrie.Data;
using Mrie.Shared.Modals.Downloader;
using Mrie.Shared.Permissions;

namespace Mrie.Components;

[ApiController]
[Route("api/v2/zorro")]
public class DownloaderController : MrieController
{
    private static readonly ConcurrentDictionary<string, MediaInfo> _cache = new();
    private IConfiguration _configuration;
    private readonly IHubContext<DownloaderHub> _hub;


    public DownloaderController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IConfiguration configuration, IHubContext<DownloaderHub> hub) : base(context, userManager)
    {
        _configuration = configuration;
        _hub = hub;
    }

    [HttpGet("info")]
    public async Task<IActionResult> GetInfo([FromQuery] string url)
    {
        if (!await HasPermission(PermissionType.Zorro))
            return Forbid();

        if (!BaseDownloader.IsValidUrl(url, out var sanitizedUrl))
            return BadRequest("Invalid URL.");

        if (!_cache.TryGetValue(url, out var info))
        {
            var downloader = BaseDownloader.FindBestMatch(url);
            try
            {
                info = await downloader.GetInfo(url);

                if (info == null)
                    return StatusCode(500, "Failed to fetch media info.");

                _cache[url] = info;
            }
            catch (OperationRejectedException e)
            {
                return StatusCode(500, e.Message);
            }
        }

        return Ok(info);
    }

    private static readonly ConcurrentDictionary<string, (MediaType Type, string FilePath)> _downloadCache = new();

    [HttpGet("download")]
    public async Task<IActionResult> Download([FromQuery] string url, [FromQuery] MediaType type, [FromQuery] bool keep = false, [FromQuery] bool ret = true, [FromQuery] bool noInfo = false)
    {
        if (!await HasPermission(PermissionType.Zorro))
            return Forbid();

        if ((noInfo || keep) && !await HasPermission(PermissionType.ManageApps))
            return Forbid();

        if (!BaseDownloader.IsValidUrl(url, out var sanitizedUrl))
            return BadRequest("Invalid URL.");

        string cacheKey = $"{url}|{type}";
        if (_downloadCache.TryGetValue(cacheKey, out var cachedEntry) && System.IO.File.Exists(cachedEntry.FilePath))
        {
            if (keep && !ret)
                return NoContent();

            var stream = System.IO.File.OpenRead(cachedEntry.FilePath);
            var mime = cachedEntry.Type == MediaType.AudioOnly ? "audio/mpeg" : "video/mp4";

            return File(stream, mime, Path.GetFileName(cachedEntry.FilePath));
        }

        var selectedDownloader = BaseDownloader.FindBestMatch(url);
        MediaInfo? info = null;
        if (!noInfo)
        {
            if (!_cache.TryGetValue(url, out info))
            {
                info = await selectedDownloader.GetInfo(url);
                if (info == null)
                    return StatusCode(500, "Failed to fetch media info.");
                _cache[url] = info;
            }

            if (info.IsPlaylist)
                return BadRequest("Playlists are not supported.");
        }

        var downloadDir = keep
            ? _configuration["KeptZorroPath"] ?? "kept"
            : "output";

        try
        {
            //selectedDownloader.Progressed += OnProgressed; // This is a very bad implementation, looking back now that I'm done.
            string filePath = await selectedDownloader.Download(url, type, info, downloadDir);
            string? fullPath;
            if (info == null)
            {
                fullPath = Directory.EnumerateFiles(downloadDir).FirstOrDefault(f => Path.GetFileName(f).StartsWith(filePath));
            }
            else
            {
                fullPath = Directory.GetFiles(downloadDir, $"{Path.GetFileName(filePath)}.*").FirstOrDefault();
            }
            
            if (fullPath == null || !System.IO.File.Exists(fullPath))
                return StatusCode(500, $"File not found after download. DEBUG Expected at {downloadDir} + {filePath}");

            _downloadCache[cacheKey] = (type, fullPath);

            if (keep && !ret)
                return NoContent();

            var stream = System.IO.File.OpenRead(fullPath);
            var mime = type == MediaType.AudioOnly ? "audio/mpeg" : "video/mp4";

            return File(stream, mime, Path.GetFileName(fullPath));
        }
        catch (OperationRejectedException e)
        {
            return StatusCode(500, e.Message);
        }
    }

    public async Task OnProgressed(string url, string message)
    {
        await _hub.Clients.Group(url)
           .SendAsync("ReceiveZorroProgress", message);
    }

    /*[HttpGet("download")]
    public async Task<IActionResult> Download([FromQuery] string url, [FromQuery] MediaType type, [FromQuery] bool keepOnServer = false)
    {
        if (!await HasPermission(PermissionType.Zorro))
            return Forbid();

        if (!BaseDownloader.IsValidUrl(url, out var sanitizedUrl))
            return BadRequest("Invalid URL.");

        if (!_cache.TryGetValue(url, out var info))
        {
            var downloader = BaseDownloader.FindBestMatch(url);
            info = await downloader.GetInfo(url);

            if (info == null)
                return StatusCode(500, "Failed to fetch media info.");

            _cache[url] = info;
        }

        if (info.IsPlaylist)
            return BadRequest("Playlists are not supported.");

        var selectedDownloader = BaseDownloader.FindBestMatch(url);
        try
        {
            var filePath = await selectedDownloader.Download(url, type, info, keepOnServer ? "" : "output");
            string? realPath = Directory.GetFiles("output", $"{Path.GetFileName(filePath)}.*").FirstOrDefault();

            if (!System.IO.File.Exists(realPath))
                return StatusCode(500, "File not found after download.");

            var mime = type == MediaType.AudioOnly ? "audio/mpeg" : "video/mp4";
            var stream = System.IO.File.OpenRead(realPath);
            var fileName = Path.GetFileName(realPath);

            return File(stream, mime, fileName);
        }
        catch (OperationRejectedException e)
        {
            return StatusCode(500, e.Message);
        }
    }*/
}