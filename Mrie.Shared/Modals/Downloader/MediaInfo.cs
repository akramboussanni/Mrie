namespace Mrie.Shared.Modals.Downloader;

public class MediaInfo
{
    public string Title { get; set; }
    public string Thumbnail { get; set; }
    public int? PlaylistCount { get; set; } = -1;
    public string Extractor { get; set; }
    public bool IsPlaylist => PlaylistCount > -1;
}