using Mrie.Components.Downloader.Providers;
using Mrie.Services.RegistererService;

namespace Mrie.Components.Downloader;

public class DownloaderRegisterer : TypedRegisterer<BaseDownloader>
{
    public override string Id => "downloader";
    public override Type RegisteringType => typeof(BaseDownloader);

    public override void Unregister(Type type)
    {
        Registered.Remove(type);
    }

    public override void Register(Type type)
    {
        if (!Registered.ContainsKey(type))
        {
            Console.WriteLine($"Registering downloader: {type.Name}");
            var downloader = (BaseDownloader)Activator.CreateInstance(type);

            Registered[type] = downloader;
            Console.WriteLine($"Registered downloader: {downloader.GetType().Name}");
        }
    }
}