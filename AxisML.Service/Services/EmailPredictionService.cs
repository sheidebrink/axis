using Microsoft.ML;
using Microsoft.ML.Data;
using AxisML.Service.Models;
using System.Text.RegularExpressions;

namespace AxisML.Service.Services;

public class EmailPredictionService
{
    private readonly MLContext _mlContext;
    private readonly string _modelsPath = "Models/Trained";
    private readonly Dictionary<string, ITransformer> _loadedModels = new();

    public EmailPredictionService()
    {
        _mlContext = new MLContext(seed: 0);
    }

    private ITransformer? LoadModelForUser(string userEmail)
    {
        var sanitizedEmail = SanitizeEmail(userEmail);
        
        if (_loadedModels.ContainsKey(sanitizedEmail))
            return _loadedModels[sanitizedEmail];

        var versionFile = Path.Combine(_modelsPath, $"{sanitizedEmail}_latest.txt");
        if (!File.Exists(versionFile))
        {
            Console.WriteLine($"No trained model found for {userEmail}, using rule-based predictions");
            return null;
        }

        var version = File.ReadAllText(versionFile).Trim();
        var modelPath = Path.Combine(_modelsPath, $"{sanitizedEmail}_{version}.zip");
        
        if (!File.Exists(modelPath))
        {
            Console.WriteLine($"Model file not found: {modelPath}");
            return null;
        }

        try
        {
            var model = _mlContext.Model.Load(modelPath, out _);
            _loadedModels[sanitizedEmail] = model;
            Console.WriteLine($"Loaded trained model for {userEmail}: {version}");
            return model;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading model for {userEmail}: {ex.Message}");
            return null;
        }
    }

    private string SanitizeEmail(string email)
    {
        return email.Replace("@", "_at_").Replace(".", "_");
    }

    public EmailInsightsResponse AnalyzeEmail(EmailInsightsRequest request, string userEmail)
    {
        var model = LoadModelForUser(userEmail);
        var prediction = model != null 
            ? PredictWithModel(request, model) 
            : PredictPriority(request);
        
        var entities = ExtractEntities(request);
        var recommendations = GenerateRecommendations(prediction, entities, request);
        
        return new EmailInsightsResponse
        {
            EmailId = request.EmailId,
            PriorityScore = prediction.PriorityScore,
            Category = prediction.PredictedCategory,
            Sentiment = prediction.PredictedSentiment,
            Entities = entities,
            SimilarClaims = GetSimilarClaims(entities.ClaimId),
            Recommendations = recommendations,
            PredictedCloseDays = PredictCloseDays(prediction),
            FraudIndicators = DetectFraudIndicators(request, entities)
        };
    }

    private EmailPrediction PredictWithModel(EmailInsightsRequest request, ITransformer model)
    {
        // For now, still use rule-based until we implement actual ML prediction
        // This is where you'd use model.Transform() with the trained model
        Console.WriteLine("Using trained model for prediction (placeholder)");
        return PredictPriority(request);
    }

    private EmailPrediction PredictPriority(EmailInsightsRequest request)
    {
        var text = $"{request.Subject} {request.Body}".ToLower();
        
        float priority = 50;
        if (text.Contains("attorney") || text.Contains("lawyer")) priority += 30;
        if (text.Contains("urgent") || text.Contains("immediate")) priority += 20;
        if (text.Contains("injury") || text.Contains("pain")) priority += 15;
        if (text.Contains("unacceptable") || text.Contains("frustrated")) priority += 10;
        priority = Math.Min(100, priority);

        string category = "General";
        if (text.Contains("injury") || text.Contains("pain") || text.Contains("medical"))
            category = "Medical - Injury";
        else if (text.Contains("attorney") || text.Contains("lawyer") || text.Contains("litigation"))
            category = "Legal";
        else if (text.Contains("property") || text.Contains("damage"))
            category = "Property";

        string sentiment = "neutral";
        if (text.Contains("unacceptable") || text.Contains("frustrated") || text.Contains("angry"))
            sentiment = "escalating";
        else if (text.Contains("attorney") || text.Contains("urgent"))
            sentiment = "concerned";
        else if (text.Contains("thank") || text.Contains("appreciate"))
            sentiment = "calm";

        return new EmailPrediction
        {
            PriorityScore = priority,
            PredictedCategory = category,
            PredictedSentiment = sentiment
        };
    }

    private ExtractedEntities ExtractEntities(EmailInsightsRequest request)
    {
        var text = $"{request.Subject} {request.Body}";
        var entities = new ExtractedEntities { Parties = new List<string> { request.From } };

        var claimMatch = Regex.Match(text, @"claim\s*#?\s*(\d+)", RegexOptions.IgnoreCase);
        if (claimMatch.Success)
            entities.ClaimId = claimMatch.Groups[1].Value;

        var amountMatch = Regex.Match(text, @"\$\s*([\d,]+)");
        if (amountMatch.Success && decimal.TryParse(amountMatch.Groups[1].Value.Replace(",", ""), out var amount))
            entities.Amount = amount;

        var dateMatch = Regex.Match(text, @"\d{1,2}/\d{1,2}/\d{4}");
        if (dateMatch.Success)
            entities.IncidentDate = dateMatch.Value;

        return entities;
    }

    private List<string> GenerateRecommendations(EmailPrediction prediction, ExtractedEntities entities, EmailInsightsRequest request)
    {
        var recommendations = new List<string>();
        var text = $"{request.Subject} {request.Body}".ToLower();

        if (text.Contains("attorney") || text.Contains("lawyer"))
            recommendations.Add("Flag for legal review");
        
        if (prediction.PredictedCategory.Contains("Medical"))
            recommendations.Add("Schedule medical review within 48h");
        
        if (prediction.PriorityScore > 70)
            recommendations.Add("Respond within 24 hours");
        
        if (entities.Amount.HasValue && entities.Amount > 25000)
            recommendations.Add("Consider reserve increase");
        
        if (prediction.PredictedSentiment == "escalating")
            recommendations.Add("Escalate to supervisor");

        return recommendations;
    }

    private List<SimilarClaim> GetSimilarClaims(string? claimId)
    {
        return new List<SimilarClaim>
        {
            new() { Id = "9876", Outcome = "Settled", DaysToClose = 45, SettlementAmount = 30000 },
            new() { Id = "7654", Outcome = "Litigated", DaysToClose = 180 }
        };
    }

    private int PredictCloseDays(EmailPrediction prediction)
    {
        return prediction.PredictedCategory switch
        {
            "Legal" => 120,
            "Medical - Injury" => 60,
            _ => 30
        };
    }

    private List<FraudIndicator> DetectFraudIndicators(EmailInsightsRequest request, ExtractedEntities entities)
    {
        return new List<FraudIndicator>();
    }
}
