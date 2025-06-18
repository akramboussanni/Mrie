namespace Mrie.Services.RegistererService;

public class DisableRegisterAttribute : Attribute
{
    /// <summary>
    ///     This attribute is used to disable the registration of a type in the registerer service.
    /// </summary>
    public DisableRegisterAttribute()
    {
        // This attribute is intentionally left empty.
        // It serves as a marker to indicate that the type should not be registered.
    }
}