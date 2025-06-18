namespace Mrie.Shared.Modals.Signups;

public class CategoryParticipant
{
    public string SignupCategoryId { get; set; }  // Foreign key to category
    public string PersonId { get; set; }          // Foreign key to person
    public SignupCategory Category { get; set; }
    public Person Person { get; set; }
}