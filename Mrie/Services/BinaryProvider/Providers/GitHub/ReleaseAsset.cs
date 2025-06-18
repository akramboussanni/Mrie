using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace Mrie.Services.BinaryProvider.Providers.GitHub;

public class ReleaseAsset
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; }
    [JsonPropertyName("size")] public int Size { get; set; }
    [JsonPropertyName("url")] public string Url { get; set; }
    [JsonPropertyName("browser_download_url")] public string BrowserDownloadUrl { get; set; }

    public ReleaseAsset()
    {
    }

    public ReleaseAsset(int id, string name, int size, string url, string browser_download_url)
    {
        Id = id;
        Name = name;
        Size = size;
        Url = url;
        BrowserDownloadUrl = browser_download_url;
    }
}
