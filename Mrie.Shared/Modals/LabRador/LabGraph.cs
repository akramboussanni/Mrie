namespace Mrie.Shared.Modals.LabRador;

public class LabGraph
{
    public string XAxis { get; set; }
    public string YAxis { get; set; }
    public string GraphType { get; set; }

    public override string ToString()
        => $"A graph resembling {GraphType}, of x {XAxis} and y {YAxis}";
}