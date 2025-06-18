using Mrie.Services.RegistererService;

namespace Mrie.Services.BinaryProvider;

public class BinaryRegisterer : TypedRegisterer<Binary>
{
    public override string Id => "bin";
    public Dictionary<string, Binary> Binaries { get; } = new();
    public override Type RegisteringType => typeof(Binary);

    public override void RegisterAll()
    {
        Directory.CreateDirectory(Binary.BinaryFolder);
        base.RegisterAll();
    }

    public override void Unregister(Type type)
    {
        Registered.Remove(type);
    }

    public override void Register(Type type)
    {
        if (!Registered.ContainsKey(type))
        {
            Console.WriteLine($"Registering binary: {type.Name}");
            var bin = (Binary)Activator.CreateInstance(type);

            if (!bin.IsInstalled)
                bin.Install();

            Registered[type] = bin;
            Binaries.Add(bin.Name, bin);
            Console.WriteLine($"Registered binary: {bin.Name} ({bin.Version})");
        }
    }


}