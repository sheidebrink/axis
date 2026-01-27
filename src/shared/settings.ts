import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Settings {
  environment: 'development' | 'qa' | 'production';
  api: {
    baseUrl: string;
    apiKey: string;
  };
  vendors: {
    salesforce: {
      url: string;
      clientId: string;
      clientSecret: string;
    };
    zendesk: {
      url: string;
      apiToken: string;
    };
    O365: {
      enabled: boolean;
      appId: string;
      clientSecret: string;
      tenantId: string;
    };
  };
  features: {
    enableAnalytics: boolean;
    enableDebugTools: boolean;
  };
}

function loadSettings(): Settings {
  const settingsPath = join(process.cwd(), 'settings.json');
  
  if (!existsSync(settingsPath)) {
    throw new Error(
      'settings.json not found. Copy settings.example.json to settings.json and configure.'
    );
  }

  const raw = readFileSync(settingsPath, 'utf-8');
  return JSON.parse(raw);
}

export const settings = loadSettings();
