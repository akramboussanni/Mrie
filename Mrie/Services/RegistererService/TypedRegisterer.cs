using System;
using System.Collections.Generic;

namespace Mrie.Services.RegistererService;

public abstract class TypedRegisterer<T> : BaseRegisterer
{
    public Dictionary<Type, T> Registered { get; set; } = new();

    public override void UnregisterAll()
    {
        foreach (var kvp in Registered)
            Unregister(kvp.Key);
    }
}