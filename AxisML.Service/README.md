# Axis ML Service

ML.NET-powered prediction service for email analysis with automated training pipeline.

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

## Configuration

Add O365 credentials to `appsettings.Development.json`:
```json
{
  "O365": {
    "ClientId": "your-client-id",
    "TenantId": "your-tenant-id",
    "ClientSecret": "your-client-secret",
    "UserEmail": "user@domain.com"
  }
}
```

## Hangfire Dashboard

View scheduled jobs and history: `http://localhost:5000/hangfire`

## Background Jobs

**Automated Training:**
- Runs daily at 2:00 AM UTC
- Extracts latest 500 emails from O365
- Stores in SQLite database (`training_data.db`)
- Trains ML models when sufficient data available (50+ emails)
- Versions models with timestamps

**Manual Trigger:**
```bash
curl -X POST http://localhost:5000/api/jobs/trigger
```

**Check Status:**
```bash
curl http://localhost:5000/api/jobs/status
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
