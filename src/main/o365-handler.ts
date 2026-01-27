import { ipcMain } from 'electron';
import fetch from 'node-fetch';

interface O365Config {
  appId: string;
  clientSecret: string;
  tenantId: string;
}

let accessToken: string | null = null;
let config: O365Config | null = null;

export function setupO365Auth(o365Config: O365Config) {
  config = o365Config;

  ipcMain.handle('o365-get-token', async () => {
    if (accessToken) return accessToken;
    if (!config) throw new Error('O365 not configured');

    const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: config.appId,
      client_secret: config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data: any = await response.json();
    accessToken = data.access_token;
    return accessToken;
  });

  ipcMain.handle('o365-get-messages', async (_, userEmail: string, top: number) => {
    const token = await getAccessToken();
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages?$select=id,subject,from,receivedDateTime,bodyPreview,isRead,hasAttachments&$orderby=receivedDateTime DESC&$top=${top}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return await response.json();
  });

  ipcMain.handle('o365-get-message', async (_, userEmail: string, messageId: string) => {
    const token = await getAccessToken();
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return await response.json();
  });

  ipcMain.handle('o365-mark-read', async (_, userEmail: string, messageId: string) => {
    const token = await getAccessToken();
    
    await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      }
    );
  });

  ipcMain.handle('o365-send-reply', async (_, userEmail: string, messageId: string, comment: string) => {
    const token = await getAccessToken();
    
    await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}/reply`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      }
    );
  });

  ipcMain.handle('o365-send-message', async (_, userEmail: string, to: string, subject: string, body: string) => {
    const token = await getAccessToken();
    
    await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'text', content: body },
            toRecipients: [{ emailAddress: { address: to } }],
          },
        }),
      }
    );
  });
}

async function getAccessToken(): Promise<string> {
  if (accessToken) return accessToken;
  if (!config) throw new Error('O365 not configured');

  const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data: any = await response.json();
  accessToken = data.access_token;
  return accessToken;
}
