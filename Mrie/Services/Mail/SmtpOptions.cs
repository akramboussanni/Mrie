using System.Security;
using MailKit.Security;

namespace Mrie.Services.Mail;

public class SmtpOptions
{
    public const string Key = "Smtp";
    
    public string Username { get; set; }
    public string Password { get; set; }
    public string Host { get; set; }
    public int Port { get; set; }
    public SecureSocketOptions Security { get; set; }
    public string SenderName { get; set; }
}