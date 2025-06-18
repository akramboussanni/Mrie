namespace Mrie.Shared.Modals;

public class WatchPartyObject
{
    public string Id { get; } = Guid.NewGuid().ToString();
    public string HostConnectionId { get; set; }
    public string VideoUrl { get; set; }
    public bool IsPlaying { get; set; }
    public double CurrentTime { get; set; }
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;
}