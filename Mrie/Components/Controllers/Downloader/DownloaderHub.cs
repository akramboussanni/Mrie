using Microsoft.AspNetCore.SignalR;

public class DownloaderHub : Hub
{
    public async Task JoinGroup(string downloadId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, downloadId);
    }

    public async Task LeaveGroup(string downloadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, downloadId);
    }
}
