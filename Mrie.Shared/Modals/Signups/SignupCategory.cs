namespace Mrie.Shared.Modals.Signups;

public class SignupCategory
{
    public string Id { get; set; }
    public string SignupObjectId { get; set; }
    public string CategoryName { get; set; }
    public int Limit { get; set; }
    public List<CategoryParticipant> Participants { get; set; } = [];
    public bool Readonly { get; set; }
}