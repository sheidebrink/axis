using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace AxisML.Service.Services;

public class EmailExtractionService
{
    private readonly GraphServiceClient _graphClient;
    private readonly IConfiguration _configuration;

    public EmailExtractionService(IConfiguration configuration)
    {
        _configuration = configuration;
        
        var clientId = configuration["O365:ClientId"];
        var tenantId = configuration["O365:TenantId"];
        var clientSecret = configuration["O365:ClientSecret"];

        Console.WriteLine($"[EmailExtraction] ClientId: {clientId?.Substring(0, 8)}...");
        Console.WriteLine($"[EmailExtraction] TenantId: {tenantId?.Substring(0, 8)}...");
        Console.WriteLine($"[EmailExtraction] ClientSecret: {(string.IsNullOrEmpty(clientSecret) ? "MISSING" : "SET")}");

        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        _graphClient = new GraphServiceClient(credential);
    }

    public async Task<List<(string Id, string Subject, string Body, string From, DateTime Received)>> ExtractEmailsAsync(string userEmail, int maxEmails = 100)
    {
        var emails = new List<(string, string, string, string, DateTime)>();

        try
        {
            Console.WriteLine($"Fetching messages for: {userEmail}");
            
            var messages = await _graphClient.Users[userEmail]
                .Messages
                .GetAsync(config =>
                {
                    config.QueryParameters.Top = maxEmails;
                    config.QueryParameters.Select = new[] { "id", "subject", "body", "from", "receivedDateTime" };
                    config.QueryParameters.Orderby = new[] { "receivedDateTime DESC" };
                });

            if (messages?.Value != null)
            {
                Console.WriteLine($"Found {messages.Value.Count} messages");
                foreach (var message in messages.Value)
                {
                    emails.Add((
                        message.Id ?? "",
                        message.Subject ?? "",
                        message.Body?.Content ?? "",
                        message.From?.EmailAddress?.Address ?? "",
                        message.ReceivedDateTime?.DateTime ?? DateTime.UtcNow
                    ));
                }
            }
            else
            {
                Console.WriteLine("No messages returned from Graph API");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error extracting emails: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
        }

        return emails;
    }
}
