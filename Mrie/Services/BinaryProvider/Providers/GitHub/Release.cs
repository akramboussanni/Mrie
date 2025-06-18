using System;
using System.Runtime.Serialization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Mrie.Services.BinaryProvider.Providers.GitHub;

public class Release
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("tag_name")] public string TagName { get; set; }
    [JsonPropertyName("prerelease")] public bool PreRelease { get; set; }
    [JsonPropertyName("created_at")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("body")] public string Body { get; set; }
    [JsonPropertyName("assets")] public ReleaseAsset[] Assets { get; set; }

    public Release()
    {}

    public Release(int id, string tag_name, bool prerelease, DateTime created_at, string body, ReleaseAsset[] assets)
    {
        Id = id;
        TagName = tag_name;
        PreRelease = prerelease;
        CreatedAt = created_at;
        Body = body;
        Assets = assets;
    }
}
