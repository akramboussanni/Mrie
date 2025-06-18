namespace Mrie.Components.Controllers;

public class OperationRejectedException : Exception
{
    public OperationRejectedException(string message) : base(message) { }
}