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

  ipcMain.handle('o365-calculate-stats', async (_, userEmail: string) => {
    const token = await getAccessToken();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const over24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const over48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const over72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    // Fetch inbox messages
    const inboxResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages?$filter=receivedDateTime ge ${thirtyDaysAgo.toISOString()}&$select=id,conversationId,receivedDateTime,isRead&$top=1000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const inbox = await inboxResponse.json();

    // Fetch sent messages
    const sentResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/mailFolders/sentitems/messages?$filter=sentDateTime ge ${thirtyDaysAgo.toISOString()}&$select=id,conversationId,sentDateTime&$top=1000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const sent = await sentResponse.json();

    const inboxMessages = inbox.value || [];
    const sentMessages = sent.value || [];

    let unreadEmails = 0;
    let unrepliedEmails = 0;
    let emailsUnreadOver48Hours = 0;
    let emailsUnrepliedOver72Hours = 0;
    let emailsPendingReply = 0;
    let oldestUnrepliedDate: Date | null = null;
    const responseTimesHours: number[] = [];
    const emailsByHour: Record<number, number> = {};
    const repliesByHour: Record<number, number> = {};
    const conversationTouches: Record<string, number> = {};

    // Process inbox messages
    for (const email of inboxMessages) {
      const receivedDate = new Date(email.receivedDateTime);
      const hour = receivedDate.getHours();
      emailsByHour[hour] = (emailsByHour[hour] || 0) + 1;

      if (!email.isRead) {
        unreadEmails++;
        if (receivedDate <= over48h) emailsUnreadOver48Hours++;
      }

      // Find replies in sent items
      const replies = sentMessages
        .filter((s: any) => s.conversationId === email.conversationId && new Date(s.sentDateTime) > receivedDate)
        .sort((a: any, b: any) => new Date(a.sentDateTime).getTime() - new Date(b.sentDateTime).getTime());

      if (replies.length > 0) {
        const firstReply = replies[0];
        const responseTime = (new Date(firstReply.sentDateTime).getTime() - receivedDate.getTime()) / (1000 * 60 * 60);
        responseTimesHours.push(responseTime);
        conversationTouches[email.conversationId] = replies.length;
      } else {
        emailsPendingReply++;
        if (!oldestUnrepliedDate || receivedDate < oldestUnrepliedDate) {
          oldestUnrepliedDate = receivedDate;
        }
        if (receivedDate <= over72h) emailsUnrepliedOver72Hours++;
        if (receivedDate <= over24h) unrepliedEmails++;
      }
    }

    // Process sent messages for reply hours
    for (const sent of sentMessages) {
      const hour = new Date(sent.sentDateTime).getHours();
      repliesByHour[hour] = (repliesByHour[hour] || 0) + 1;
    }

    // Calculate stats
    const avgResponseTime = responseTimesHours.length > 0 
      ? responseTimesHours.reduce((a, b) => a + b, 0) / responseTimesHours.length 
      : 0;
    
    const sortedTimes = [...responseTimesHours].sort((a, b) => a - b);
    const median = sortedTimes.length > 0
      ? sortedTimes.length % 2 === 0
        ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
        : sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0;

    const multiTouchConvs = Object.values(conversationTouches).filter(c => c > 1).length;
    const multiTouchRate = Object.keys(conversationTouches).length > 0
      ? (multiTouchConvs / Object.keys(conversationTouches).length) * 100
      : 0;

    const oldestUnrepliedAgeHours = oldestUnrepliedDate
      ? (now.getTime() - oldestUnrepliedDate.getTime()) / (1000 * 60 * 60)
      : 0;

    const replyRate = inboxMessages.length > 0
      ? (responseTimesHours.length / inboxMessages.length) * 100
      : 0;

    const inboxGrowthRate = sentMessages.length > 0
      ? ((inboxMessages.length - sentMessages.length) / sentMessages.length) * 100
      : 0;

    const peakEmailHour = Object.entries(emailsByHour).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    const peakReplyHour = Object.entries(repliesByHour).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    return {
      email: userEmail,
      totalEmails: inboxMessages.length,
      totalEmailsSent: sentMessages.length,
      unreadEmails,
      unrepliedEmails,
      averageResponseTimeHours: avgResponseTime,
      minResponseTimeHours: sortedTimes[0] || 0,
      maxResponseTimeHours: sortedTimes[sortedTimes.length - 1] || 0,
      medianResponseTimeHours: median,
      emailsPendingReply,
      oldestUnrepliedEmailAgeHours: oldestUnrepliedAgeHours,
      replyRate,
      multiTouchRate,
      reopenedConversations: 0, // Complex to calculate, would need conversation history
      emailsHandledPerDay: sentMessages.length / 30,
      emailsUnreadOver48Hours,
      emailsUnrepliedOver72Hours,
      inboxGrowthRate,
      peakEmailArrivalHour: Number(peakEmailHour),
      peakReplyHour: Number(peakReplyHour),
    };
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
