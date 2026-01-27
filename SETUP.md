# Setup

## 1. Install Dependencies
```bash
npm install
```

## 2. Configure Settings
```bash
cp settings.example.json settings.json
```

Edit `settings.json` with your secrets:
- API keys
- Vendor credentials (Salesforce, Zendesk)
- Environment-specific URLs

**⚠️ Never commit `settings.json` - it's in `.gitignore`**

## 3. Run
```bash
npm run dev
```
