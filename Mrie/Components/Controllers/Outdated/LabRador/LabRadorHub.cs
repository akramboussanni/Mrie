using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Mrie.Data;
using Mrie.Shared.Modals.LabRador;
using Mrie.Shared.Modals.LabRador.Results;

namespace Mrie.Components.LabRador;

public class LabRadorHub : Hub
{
    public static Dictionary<string, List<string>> LabRadorMapping  { get; set; } = new();
    
    public void SubscribeUpdates(string id)
    {
        if (!LabRadorMapping.ContainsKey(id))
            LabRadorMapping.Add(id, [Context.ConnectionId]);
        else
            LabRadorMapping[id].Add(Context.ConnectionId);
    }
}