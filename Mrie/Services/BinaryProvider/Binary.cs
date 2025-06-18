using System.Diagnostics;
using System.Runtime.InteropServices;
using Mrie.Services.RegistererService;

namespace Mrie.Services.BinaryProvider;

public abstract class Binary
{
    public abstract string Name { get; }
    public abstract Dictionary<OSPlatform, string> BinaryFiles { get; }
    public string BinaryFile => GetPlatformDependant(BinaryFiles);

    public virtual string Version { get; } = "0.0.0";
    public virtual short Priority { get; } = 0;
    //Todo: crossplatform support
    // the todo has been done! :) mostly

    public abstract void Install();
    public virtual bool IsInstalled
        => File.Exists(BinaryPath)/* || IsInPath(BinaryFile)*/;

    public T GetPlatformDependant<T>(Dictionary<OSPlatform, T> dict)
    {
        foreach (var kvp in dict)
        {
            if (RuntimeInformation.IsOSPlatform(kvp.Key))
                return kvp.Value;
        }

        throw new KeyNotFoundException("The OS was not present in the dictionary.");
    }

    public virtual async Task<int> RunAsync(string args,
        Action<string>? onOutput = null, Action<string>? onError = null)
    {
        var tcs = new TaskCompletionSource<int>();
        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = BinaryPath,
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            },
            EnableRaisingEvents = true
        };

        process.OutputDataReceived += (s, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
                onOutput?.Invoke(e.Data);
        };

        process.ErrorDataReceived += (s, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
                onError?.Invoke(e.Data);
        };

        process.Exited += (s, e) =>
        {
            tcs.SetResult(process.ExitCode);
            process.Dispose();
        };

        /*var env = Environment.GetEnvironmentVariable("PATH");
        process.StartInfo.Environment["PATH"] = env + $";{BinaryPath}";*/

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        return await tcs.Task;
    }

    private static BinaryRegisterer _cachedRegisterer;
    private static BinaryRegisterer Registerer
    {
        get
        {
            _cachedRegisterer ??= (BinaryRegisterer)BaseRegisterer.Get("bin");
            return _cachedRegisterer;
        }
    }

    public static async Task RunBinaryAsync(string name, string args,
        Action<string>? onOutput = null, Action<string>? onError = null)
    {
        if (!TryGetBinary(name, out var binary))
            throw new InvalidOperationException($"Binary '{name}' is not registered or not installed.");

        await binary.RunAsync(args, onOutput, onError);
    }

    public static Binary GetBinary(string name)
        => Registerer.Binaries[name];

    public static bool TryGetBinary(string name, out Binary binary)
        => Registerer.Binaries.TryGetValue(name, out binary) && binary.IsInstalled;

    public virtual string BinaryPath => Path.Combine(BinaryFolder, BinaryFile);
    public static string BinaryFolder = Path.Combine(AppContext.BaseDirectory, "bin");

    public static bool IsInPath(string command)
    {
        var paths = Environment.GetEnvironmentVariable("PATH")?.Split(Path.PathSeparator) ?? Array.Empty<string>();
        var isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);

        var extensions = isWindows
            ? Environment.GetEnvironmentVariable("PATHEXT")?.Split(';') ?? new[] { ".exe", ".bat", ".cmd" }
            : new[] { "" }; // Linux has no ext problem :)

        foreach (var path in paths)
        {
            foreach (var ext in extensions)
            {
                var fullPath = Path.Combine(path, command + ext);
                if (File.Exists(fullPath) && (isWindows || IsExecutable(fullPath)))
                    return true;
            }
        }

        return false;
    }

    private static bool IsExecutable(string path)
    {
        var fileInfo = new FileInfo(path);
        return fileInfo.Exists && (fileInfo.Attributes & FileAttributes.Directory) == 0 && 
               new FileInfo(path).UnixFileMode.HasFlag(UnixFileMode.UserExecute);
    }
}