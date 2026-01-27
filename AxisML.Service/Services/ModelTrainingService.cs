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
            var emails = _dataContext.GetAllEmailsWithLabels(userEmail);
            var trainingData = emails.Where(e => e.Priority.HasValue).Select(e => new EmailTrainingData
            {
                Subject = e.Subject,
                Body = e.Body,
                Priority = e.Priority!.Value
            }).ToList();

            if (trainingData.Count < 50)
            {
                Console.WriteLine($"Not enough labeled data: {trainingData.Count}");
                return false;
            }

            var dataView = _mlContext.Data.LoadFromEnumerable(trainingData);

            // Train priority regression model
            Console.WriteLine("Training priority regression model...");
            var pipeline = _mlContext.Transforms.Text
                .FeaturizeText("SubjectFeatures", nameof(EmailTrainingData.Subject))
                .Append(_mlContext.Transforms.Text.FeaturizeText("BodyFeatures", nameof(EmailTrainingData.Body)))
                .Append(_mlContext.Transforms.Concatenate("Features", "SubjectFeatures", "BodyFeatures"))
                .Append(_mlContext.Regression.Trainers.FastTree(labelColumnName: nameof(EmailTrainingData.Priority)));

            var model = pipeline.Fit(dataView);

            // Save model
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var modelPath = Path.Combine(_modelsPath, $"{SanitizeEmail(userEmail)}_{timestamp}.zip");
            _mlContext.Model.Save(model, dataView.Schema, modelPath);
            
            Console.WriteLine($"Model trained and saved: {modelPath}");
            File.WriteAllText(Path.Combine(_modelsPath, $"{SanitizeEmail(userEmail)}_latest.txt"), timestamp);

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error training models: {ex.Message}");
            return false;
        }
    }

    private class EmailTrainingData
    {
        public string Subject { get; set; } = "";
        public string Body { get; set; } = "";
        public float Priority { get; set; }
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
