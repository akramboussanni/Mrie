using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Mrie;
using Mrie.Client.Services;
using MudBlazor.Services;
using Mrie.Components;
using Mrie.Components.Account;
using Mrie.Components.LabRador;
using Mrie.Data;
using Mrie.Services;
using Mrie.Services.Mail;
using Mrie.Shared.Permissions;
using Mrie.Services.RegistererService;
using Mrie.Services.BinaryProvider;
using Mrie.Components.Downloader;

var builder = WebApplication.CreateBuilder(args);

// Add MudBlazor services
builder.Services.AddMudServices();

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveWebAssemblyComponents()
    //.AddInteractiveServerComponents()
    .AddAuthenticationStateSerialization();

builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<IdentityUserAccessor>();
builder.Services.AddScoped<IdentityRedirectManager>();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = IdentityConstants.ApplicationScheme;
        options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
    })
    .AddIdentityCookies();
builder.Services.AddAuthorization();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ??
                       throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();
builder.Services.AddIdentityCore<ApplicationUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

var appCfg = builder.Configuration["HostUrl"] ?? "https://localhost:7218";
builder.Services.AddScoped(_ => new HttpClient
{
    BaseAddress = new Uri(appCfg)
});

builder.Services.AddScoped(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var db = provider.GetRequiredService<ApplicationDbContext>();
    return new OpenAIService(config["GptApiKey"], db);
});

//builder.Services.AddSingleton<IEmailSender<ApplicationUser>, IdentityNoOpEmailSender>();
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.Key));
builder.Services.AddScoped<IEmailSender<ApplicationUser>, SmtpSender>();
builder.Services.AddScoped<MobileService>();
builder.Services.AddHostedService<FileCleanupService>();

builder.Services.AddSignalR(o => o.EnableDetailedErrors = true);
builder.Services.AddControllers();

var app = builder.Build();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

//app.UseHttpsRedirection();
app.UseAntiforgery();

app.MapControllers();

app.MapHub<LabRadorHub>("/labrador/hub");
app.MapHub<DownloaderHub>("/zorro/hub");

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(Mrie.Client._Imports).Assembly);

// Add additional endpoints required by the Identity /Account Razor components.
app.MapAdditionalIdentityEndpoints();
RegisterAll();
await CreateDefaultAdminAsync(app);
await CreateDefaultSettings(app);
app.Run();
return;

void RegisterAll()
{
    List<Type> registerers = new()
    {
        typeof(BinaryRegisterer),
        typeof(DownloaderRegisterer),
    };

    foreach (var registerer in registerers)
        BaseRegisterer.AddRegisterer(registerer);

    BaseRegisterer.MakeRegisterers();
}

async Task CreateDefaultSettings(IHost host)
{
    using var scope = host.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    if (await db.SettingsSet.AnyAsync()) return;
    await Extensions.CreateDefaultSettings(db);
}

async Task CreateDefaultAdminAsync(IHost host)
{
    using var scope = host.Services.CreateScope();
    var services = scope.ServiceProvider;
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

    // Define admin credentials and role.
    var adminEmail = "aboussanni@yahoo.com";
    var adminPassword = "Admin1234!";

    // Check if the admin user already exists.
    var adminUser = await userManager.FindByEmailAsync(adminEmail);
    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed =true,
            LockoutEnabled = true,
            Permissions = PermissionType.Admin,
            // set any additional properties you require
        };

        var result = await userManager.CreateAsync(adminUser, adminPassword);
        if (result.Succeeded)
        {
            Console.WriteLine("Created admin user.");
            return;
        }
        Console.WriteLine("Failed to create default admin user.");

    }
}