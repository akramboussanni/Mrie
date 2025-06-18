using System.Reflection;

namespace Mrie.Services.RegistererService;

public abstract class BaseRegisterer
{
    public abstract string Id { get; }
    public virtual Type RegisteringType { get; }

    public virtual Type[] FetchTypes()
        => this.GetType().Assembly.GetTypes();

    public virtual bool EvaluateCondition(Type type)
    {
        if (type.IsInterface || type.IsAbstract)
        {
            //Methods.Debug($"Checks failed: {type.Name} is abstract or is an interace.");
            return false;
        }

        if (RegisteringType != null)
        {
            if (!type.IsSubclassOf(RegisteringType))
            {
                //Methods.Debug($"Checks failed: {type.Name} is not a subclass of {RegisteringType.Name}.");
                return false;
            }
        }

        if (type.GetCustomAttribute<DisableRegisterAttribute>() != null)
        {
            //ethods.Debug($"Checks failed: {type.Name} has the disableregister attribute.");
            return false;
        }

        return true;
    }

    public virtual void RegisterAll()
    {
        //Methods.Debug($"Registering all for {this.GetType().Name}...");
        foreach (var type in FetchTypes())
        {
            //Methods.Debug($"Attempting to register {type.Name}...");
            if (EvaluateCondition(type))
            {
                //Methods.Debug($"Registering {type}...");
                Register(type);
            }
        }
    }

    public abstract void Register(Type type);
    public virtual void UnregisterAll()
        => throw new InvalidOperationException($"{this.GetType().Name} does not implement the UnregisterAll method.");
    public abstract void Unregister(Type type);

    #region Static Methods
    internal static Dictionary<string, BaseRegisterer> Registerers { get; private set; } = new();
    public static HashSet<BaseRegisterer> PendingRegisterers { get; private set; } = new();

    public static T AddRegisterer<T>() where T : BaseRegisterer
        => (T)AddRegisterer(typeof(T));

    public static BaseRegisterer AddRegisterer(Type type)
    {
        if (!type.IsSubclassOf(typeof(BaseRegisterer)))
            throw new InvalidOperationException("Registerer must inherit BaseRegisterer.");

        var registerer = (BaseRegisterer)type.GetConstructor(Type.EmptyTypes).Invoke(null);
        AddRegisterer(registerer);
        return registerer;
    }

    public static void AddRegisterer<T>(T registerer) where T : BaseRegisterer
    {
        PendingRegisterers.Add(registerer);
    }

    public static void MakeRegisterers()
    {
        foreach (var registerer in PendingRegisterers)
        {
            try
            {
                Console.WriteLine($"Making {registerer.GetType().Name} registerer");
                registerer.RegisterAll();
                Registerers.Add(registerer.Id, registerer);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error while making registerer {registerer.GetType().Name}: {e.Message}");
            }
        }

        PendingRegisterers.Clear();
    }

    public static void KillAllRegisterers()
    {
        foreach (var registerer in Registerers)
            registerer.Value.UnregisterAll();

        Registerers.Clear();
    }

    public static BaseRegisterer Get(string id)
    {
        if (Registerers.TryGetValue(id, out var registerer))
            return registerer;

        return null;
    }
    #endregion
}