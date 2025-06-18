using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Mrie.Services;

public class FileCleanupService : BackgroundService
{
    private readonly ILogger<FileCleanupService> _logger;
    private readonly string _folderPath = Path.Combine(AppContext.BaseDirectory, "output");
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(10);
    private readonly TimeSpan _fileAgeLimit = TimeSpan.FromHours(1);

    public FileCleanupService(ILogger<FileCleanupService> logger)
    {
        _logger = logger;
        if (!Directory.Exists(_folderPath))
            Directory.CreateDirectory(_folderPath);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("FileCleanupService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var files = Directory.GetFiles(_folderPath);

                foreach (var file in files)
                {
                    var info = new FileInfo(file);
                    if (DateTime.UtcNow - info.CreationTimeUtc > _fileAgeLimit)
                    {
                        info.Delete();
                        _logger.LogInformation("Deleted old file: {File}", file);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during file cleanup.");
            }

            await Task.Delay(_cleanupInterval, stoppingToken);
        }

        _logger.LogInformation("FileCleanupService stopping.");
    }
}
