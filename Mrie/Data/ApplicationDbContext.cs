using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Mrie.Shared.Modals;
using Mrie.Shared.Modals.LabRador.Results;
using Mrie.Shared.Modals.Signups;
using Mrie.Shared.Permissions;

namespace Mrie.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<SignupObject> Signups { get; set; }
    public DbSet<UrlShortenerObject> TinyUrls  { get; set; }
    public DbSet<AppSettings> SettingsSet { get; set; }
    public DbSet<LabRadorResponse> LabRadorGenerations { get; set; }
    public DbSet<AccessToken> AccessTokens { get; set; }
    
    public async Task<AppSettings> GetSettingsAsync()
    {
        var settings = await SettingsSet.FirstAsync();
        return settings;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // I genuinely hate this so much
        // I will NEVER finish Signups
        modelBuilder.Entity<SignupObject>()
            .HasMany(s => s.Categories)
            .WithOne()
            .HasForeignKey(c => c.SignupObjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CategoryParticipant>(join =>
        {
            join.HasKey(cp => new { cp.SignupCategoryId, cp.PersonId });

            join.HasOne(cp => cp.Category)
                .WithMany(c => c.Participants)
                .HasForeignKey(cp => cp.SignupCategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            join.HasOne(cp => cp.Person)
                .WithMany()
                .HasForeignKey(cp => cp.PersonId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}