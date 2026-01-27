using Hangfire;
using AxisML.Service.Data;
using AxisML.Service.Services;

namespace AxisML.Service.Jobs;

public class MLTrainingJobs
{
    private readonly EmailExtractionService _extractionService;
    private readonly ModelTrainingService _trainingService;
    private readonly TrainingDataContext _dataContext;
    private readonly IConfiguration _configuration;

    public MLTrainingJobs(
        EmailExtractionService extractionService,
        ModelTrainingService trainingService,
        TrainingDataContext dataContext,
        IConfiguration configuration)
    {
        _extractionService = extractionService;
        _trainingService = trainingService;
        _dataContext = dataContext;
        _configuration = configuration;
    }

    public async Task ExtractAndTrainAsync()
    {
        var startTime = DateTime.UtcNow;
        Console.WriteLine($"[{startTime}] ===== STARTING EMAIL EXTRACTION JOB =====");

        var userEmail = _configuration["O365:UserEmail"];
        Console.WriteLine($"User email from config: '{userEmail}'");
        
        if (string.IsNullOrEmpty(userEmail))
        {
            Console.WriteLine("ERROR: No user email configured. Skipping extraction.");
            return;
        }

        try
        {
            // Extract emails
            Console.WriteLine("Calling extraction service...");
            var emails = await _extractionService.ExtractEmailsAsync(userEmail, maxEmails: 500);
            Console.WriteLine($"✓ Extracted {emails.Count} emails");

            // Save to database
            Console.WriteLine("Saving to database...");
            foreach (var email in emails)
            {
                _dataContext.SaveEmail(userEmail, email.Id, email.Subject, email.Body, email.From, email.Received);
            }

            var totalEmails = _dataContext.GetEmailCount(userEmail);
            Console.WriteLine($"✓ Total emails in database for {userEmail}: {totalEmails}");

            // Train models
            Console.WriteLine("Starting model training...");
            var success = await _trainingService.TrainModelsAsync(userEmail);
            if (success)
            {
                var version = _trainingService.GetLatestModelVersion(userEmail);
                Console.WriteLine($"✓ Training completed. Model version: {version}");
            }
            else
            {
                Console.WriteLine("⚠ Training skipped or failed");
            }

            var duration = (DateTime.UtcNow - startTime).TotalSeconds;
            Console.WriteLine($"[{DateTime.UtcNow}] ===== JOB COMPLETED in {duration:F1}s =====");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: {ex.Message}");
            Console.WriteLine($"Stack: {ex.StackTrace}");
            throw;
        }
    }

    public static void ScheduleJobs()
    {
        // Run daily at 2 AM
        RecurringJob.AddOrUpdate<MLTrainingJobs>(
            "extract-and-train",
            job => job.ExtractAndTrainAsync(),
            Cron.Daily(2));

        Console.WriteLine("Scheduled job: extract-and-train (daily at 2 AM)");
    }
}
