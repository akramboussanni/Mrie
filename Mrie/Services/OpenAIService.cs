using System.Runtime.CompilerServices;
using System.Text;
using Mrie.Data;
using Mrie.Shared.Modals.LabRador;
using OpenAI.Chat;

namespace Mrie.Services;

public class OpenAIService
{
    private ChatClient Client { get; }
    private ApplicationDbContext DbContext { get; }

    public OpenAIService(string apiKey, ApplicationDbContext dbContext)
    {
        Client = new ChatClient(model: "gpt-4.1-mini", apiKey: apiKey);
        DbContext = dbContext;
    }

    public async Task<string> GetInstructions(LabRadorRequest req)
    {
        //                                  (SECTION_NAME = "MISTAKE_FINDER", "ANALYSE_RESULTATS", "ANALYSE_DEMARCHES", "CONCLUSION").  

        var settings = await DbContext.GetSettingsAsync();
        StringBuilder instructions = new(settings.LabRadorInstructionBase);
        List<string> sections = new();
        if (req.GenerateMistakeFinder)
        {
            instructions.AppendLine(settings.LabRadorErrorFinderInstruction);
            sections.Add("\"MISTAKE_FINDER\"");
        }

        if (req.GenerateAnalyseResultats)
        {
            instructions.AppendLine(settings.LabRadorAnalyseResultatInstruction);
            sections.Add("\"ANALYSE_RESULTATS\"");
        }

        if (req.GenerateAnalyseDemarche)
        {
            instructions.AppendLine(settings.LabRadorAnalyseDemarcheInstruction);
            sections.Add("\"ANALYSE_DEMARCHES\"");
        }

        if (req.GenerateConclusion)
        {
            instructions.AppendLine(settings.LabRadorConclusionInstruction);
            sections.Add("\"CONCLUSION\"");
        }

        if (req.GenerateCalculs)
        {
            instructions.AppendLine(settings.LabRadorCalculsInstruction);
            sections.Add("\"CALCULS\"");
        }
        
        int wordMin = 0;
        int wordMax = 0;
        switch (req.GenerationLength)
        {
            case LevelType.Faible:
                wordMin = 400;
                wordMax = 500;
                break;
            case LevelType.Moyen:
                wordMin = 550;
                wordMax = 850;
                break;
            case LevelType.Fort:
                wordMin = 850;
                wordMax = 1250;
                break;
        }
        instructions = instructions
                .Replace("{frlvl}", req.LanguageLevel.ToString())
                .Replace("{wordmin}", wordMin.ToString())
                .Replace("{wordmax}", wordMax.ToString())
                .Replace("{sections}", string.Join(", ", sections));
        
        return instructions.ToString();
    }
    
    /// <summary>
    /// Streams raw response updates from OpenAI.
    /// </summary>
    public async IAsyncEnumerable<StreamingChatCompletionUpdate> StreamResponseAsync(
        LabRadorRequest req,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        string instructions = await GetInstructions(req);
        ChatCompletionOptions options = new()
        {
            MaxOutputTokenCount = 5000,
        };

        List<ChatMessage> messages = [
            new SystemChatMessage(instructions),
            new UserChatMessage("User instructions: "+req.ExtraInstructions),
            new UserChatMessage("Lab report: "+req.LabReport)
        ];

        if (req.Graphs.Count != 0)
        {
            StringBuilder graphs = new("Graphs:");
            for (int i = 0; i < req.Graphs.Count; i++)
            {
                var graph =  req.Graphs[i];
                graphs.AppendLine($"Graph {i}: {graph}");
            }
        
            messages.Add(new UserChatMessage(graphs.ToString()));   
        }
        
        await foreach (var update in Client.CompleteChatStreamingAsync(messages, options, cancellationToken: cancellationToken))
            yield return update;
    }
}