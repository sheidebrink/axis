using Microsoft.ML;
using Microsoft.ML.AutoML;
using AxisML.Service.Data;
using AxisML.Service.Models;

namespace AxisML.Service.Services;

public class ModelTrainingService
{
    private readonly MLContext _mlContext;
    private readonly TrainingDataContext _dataContext;
    private readonly string _modelsPath = "Models/Trained";

    public ModelTrainingService(TrainingDataContext dataContext)
    {
        _mlContext = new MLContext(seed: 0);
        _dataContext = dataContext;
        Directory.CreateDirectory(_modelsPath);
    }

    public async Task<bool> TrainModelsAsync(string userEmail)
    {
        var emailCount = _dataContext.GetEmailCount(userEmail);
        if (emailCount < 50)
        {
            Console.WriteLine($"Not enough training data for {userEmail}: {emailCount} emails (need at least 50)");
            return false;
        }

        Console.WriteLine($"Training models for {userEmail} with {emailCount} emails...");

        try
        {
            var emails = _dataContext.GetAllEmails(userEmail);
            var trainingData = emails.Select(e => new EmailData
            {
                Subject = e.Subject,
                Body = e.Body,
                From = e.From
            }).ToList();

            var dataView = _mlContext.Data.LoadFromEnumerable(trainingData);

            // Train priority model (simplified - would use AutoML in production)
            Console.WriteLine("Training priority model...");
            var priorityPipeline = _mlContext.Transforms.Text
                .FeaturizeText("SubjectFeatures", nameof(EmailData.Subject))
                .Append(_mlContext.Transforms.Text.FeaturizeText("BodyFeatures", nameof(EmailData.Body)))
                .Append(_mlContext.Transforms.Concatenate("Features", "SubjectFeatures", "BodyFeatures"));

            // Fit the model
            var model = priorityPipeline.Fit(dataView);

            // Save model with timestamp
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var modelPath = Path.Combine(_modelsPath, $"{SanitizeEmail(userEmail)}_{timestamp}.zip");
            _mlContext.Model.Save(model, dataView.Schema, modelPath);
            
            Console.WriteLine($"Models trained and saved: {modelPath}");
            File.WriteAllText(Path.Combine(_modelsPath, $"{SanitizeEmail(userEmail)}_latest.txt"), timestamp);

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error training models: {ex.Message}");
            return false;
        }
    }

    public string GetLatestModelVersion(string userEmail)
    {
        var versionFile = Path.Combine(_modelsPath, $"{SanitizeEmail(userEmail)}_latest.txt");
        return File.Exists(versionFile) ? File.ReadAllText(versionFile) : "none";
    }

    private string SanitizeEmail(string email)
    {
        return email.Replace("@", "_at_").Replace(".", "_");
    }
}
