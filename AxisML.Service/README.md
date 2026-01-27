# Axis ML Service

ML.NET-powered prediction service for email analysis.

## Run

**Windows:**
```bash
start.bat
```

**Manual:**
```bash
dotnet restore
dotnet run
```

Service runs on `http://localhost:5000`

**Test:**
```bash
curl http://localhost:5000/api/ml/health
```

## API

**POST /api/ml/analyze**
```json
{
  "emailId": "123",
  "subject": "Urgent: Claim #12345",
  "body": "My attorney says...",
  "from": "claimant@email.com"
}
```

**Response:**
```json
{
  "priorityScore": 85,
  "category": "Legal",
  "sentiment": "escalating",
  "entities": { "claimId": "12345" },
  "recommendations": ["Flag for legal review"],
  "predictedCloseDays": 120
}
```

## Next Steps

1. Train ML models with historical data
2. Replace rule-based logic with trained models
3. Add fraud detection model
4. Implement vector similarity for similar claims
