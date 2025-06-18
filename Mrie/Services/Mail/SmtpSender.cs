using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MimeKit;
using Mrie.Data;

namespace Mrie.Services.Mail;

public class SmtpSender(IOptions<SmtpOptions> optionsAccessor,
    ILogger<SmtpSender> logger) : IEmailSender<ApplicationUser>
{
    private readonly ILogger logger = logger;
    public SmtpOptions Options { get; } = optionsAccessor.Value;

    [field: AllowNull, MaybeNull]
    public MailboxAddress Sender => field ??= new MailboxAddress(Options.SenderName, Options.Username);
    
    public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
        => SendEmailAsync(email, "Confirm email address", "confirm",
            new Dictionary<string, string>
            {
                ["link"] = confirmationLink
            });

    public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
        => SendEmailAsync(email, "Reset password link", "resetlink",
            new Dictionary<string, string>
            {
                ["link"] = resetLink
            });

    public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
        => SendEmailAsync(email, "Reset password code", "resetcode",
            new Dictionary<string, string>
            {
                ["code"] = resetCode
            });

    public async Task<string> ReadMailTemplate(string templateName)
    {
        var resourceName = $"Mrie.Data.MailTemplates.{templateName}.html";
        
        await using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new InvalidOperationException($"Template '{templateName}' not found.");
        }

        using StreamReader reader = new (stream);
        return await reader.ReadToEndAsync();
    }
    
    public async Task SendEmailAsync(string toEmail, string subject, string templateName, Dictionary<string, string> variables)
    {
        using var client = new SmtpClient();
        
        await client.ConnectAsync(Options.Host, Options.Port, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(Options.Username, Options.Password);

        var content = await ReadMailTemplate(templateName);
        foreach (var variable in variables)
            content = content.Replace($"{{{variable.Key}}}", variable.Value);

        MimeMessage message = new();
        message.From.Add(Sender);
        message.To.Add(new MailboxAddress("Customer", toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = content };
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}