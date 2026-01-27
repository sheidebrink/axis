namespace AxisML.Service.Models;

public class EmailData
{
    public string EmailId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string? ClaimId { get; set; }
    public float Priority { get; set; } // 0-100
    public string Category { get; set; } = string.Empty; // Medical, Legal, General
    public string Sentiment { get; set; } = string.Empty; // calm, neutral, concerned, escalating, critical
}

public class EmailPrediction
{
    public float PriorityScore { get; set; }
    public string PredictedCategory { get; set; } = string.Empty;
    public string PredictedSentiment { get; set; } = string.Empty;
    public float[] CategoryScores { get; set; } = Array.Empty<float>();
}

public class EmailInsightsRequest
{
    public string EmailId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
}

public class EmailInsightsResponse
{
    public string EmailId { get; set; } = string.Empty;
    public float PriorityScore { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Sentiment { get; set; } = string.Empty;
    public ExtractedEntities Entities { get; set; } = new();
    public List<SimilarClaim> SimilarClaims { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public int PredictedCloseDays { get; set; }
    public List<FraudIndicator> FraudIndicators { get; set; } = new();
}

public class ExtractedEntities
{
    public string? ClaimId { get; set; }
    public string? IncidentDate { get; set; }
    public decimal? Amount { get; set; }
    public List<string> Parties { get; set; } = new();
}

public class SimilarClaim
{
    public string Id { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public int DaysToClose { get; set; }
    public decimal? SettlementAmount { get; set; }
}

public class FraudIndicator
{
    public string Indicator { get; set; } = string.Empty;
    public float Confidence { get; set; }
}
