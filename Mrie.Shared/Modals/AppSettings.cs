namespace Mrie.Shared.Modals;

// I am totally aware that this is not the best place for this class.
// The entire settings system is a bit of a mess and needs to be refactored.
public class AppSettings
{
    public int Id { get; init; }
    public int LabRadorDailyLimit { get; set; }
    public int LabRadorCharacterLimit { get; set; }
    public int LabRadorInstructionCharacterLimit { get; set; }
    public string LabRadorInstructionBase { get; set; } = "";
    public string LabRadorErrorFinderInstruction { get; set; } = "";
    public string LabRadorAnalyseResultatInstruction { get; set; } = "";
    public string LabRadorAnalyseDemarcheInstruction { get; set; } = "";
    public string LabRadorConclusionInstruction { get; set; } = "";
    public string LabRadorCalculsInstruction { get; set; } = "";
    public string DefaultMasjid { get; set; } = "";
}