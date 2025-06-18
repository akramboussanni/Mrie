using Microsoft.AspNetCore.Components;
using MudBlazor;
using MudBlazor.Services;

namespace Mrie.Client.Services;

public class MobileService : IAsyncDisposable, IBrowserViewportObserver
{
    private readonly IBrowserViewportService _viewport;
    private Task _initializationTask;
    private bool _isInitialized;
    public event Action? OnViewportChanged;

    public bool IsMobile => _width < 600;
    private int _width;
    private int _height;

    public Guid Id { get; } = Guid.NewGuid();

    public MobileService(IBrowserViewportService viewport)
    {
        _viewport = viewport;
        _initializationTask = InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        if (_isInitialized) return;
        _isInitialized = true;

        await _viewport.SubscribeAsync(this, fireImmediately: true);
    }

    public async Task EnsureInitializedAsync() => await _initializationTask;

    ResizeOptions IBrowserViewportObserver.ResizeOptions => new()
    {
        ReportRate = 50,
        NotifyOnBreakpointOnly = false
    };

    Task IBrowserViewportObserver.NotifyBrowserViewportChangeAsync(BrowserViewportEventArgs args)
    {
        _width = args.BrowserWindowSize.Width;
        _height = args.BrowserWindowSize.Height;

        if (OnViewportChanged == null) return Task.CompletedTask;
        
        var invocationList = OnViewportChanged.GetInvocationList();
        foreach (var handler in invocationList.Cast<Func<Task>>())
        {
            try
            {
                handler();
            }
            catch
            {
                // Intentional empty catch clause.
            }
        }

        return Task.CompletedTask;
    }
    
    public async ValueTask DisposeAsync()
    {
        await _viewport.UnsubscribeAsync(this);
    }
}