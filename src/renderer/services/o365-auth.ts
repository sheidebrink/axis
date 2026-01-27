import { Client } from '@microsoft/microsoft-graph-client';

interface O365Config {
  appId: string;
  clientSecret: string;
  tenantId: string;
}

class O365AuthService {
  private accessToken: string | null = null;
  private config: O365Config | null = null;

  setConfig(config: O365Config): void {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    if (!this.config) throw new Error('O365 config not set');

    const { appId, clientSecret, tenantId } = this.config;
    
    // Client credentials flow for app-only access
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async getClient(): Promise<Client> {
    const token = await this.getAccessToken();
    
    return Client.init({
      authProvider: (done) => {
        done(null, token);
      },
    });
  }
}

export const o365Auth = new O365AuthService();
