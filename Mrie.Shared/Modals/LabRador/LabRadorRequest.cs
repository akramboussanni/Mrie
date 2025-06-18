namespace Mrie.Shared.Modals.LabRador;

public class LabRadorRequest
{
    public string LabReport { get; set; }
    public string ExtraInstructions { get; set; } = "";
    public List<LabGraph> Graphs { get; set; } = new();
    public LevelType LanguageLevel { get; set; } = LevelType.Moyen;
    public LevelType GenerationLength { get; set; } = LevelType.Moyen;
    public bool GenerateAnalyseResultats { get; set; }
    public bool GenerateAnalyseDemarche { get; set; }
    public bool GenerateConclusion { get; set; }
    public bool GenerateMistakeFinder { get; set; }
    public bool GenerateCalculs { get; set; }
}