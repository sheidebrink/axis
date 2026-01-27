export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  receivedDateTime: string;
  bodyPreview: string;
  body?: string;
  bodyContentType?: 'text' | 'html';
  isRead: boolean;
  hasAttachments: boolean;
}

class EmailService {
  private userEmail = 'janustest@cb-sisco.com';

  async getMessages(top: number = 50): Promise<EmailMessage[]> {
    const response = await window.electron.o365GetMessages(this.userEmail, top);

    return response.value.map((msg: any) => ({
      id: msg.id,
      subject: msg.subject || '(No Subject)',
      from: msg.from?.emailAddress?.address || 'Unknown',
      receivedDateTime: msg.receivedDateTime,
      bodyPreview: msg.bodyPreview || '',
      isRead: msg.isRead,
      hasAttachments: msg.hasAttachments,
    }));
  }

  async getMessage(messageId: string): Promise<EmailMessage> {
    const msg = await window.electron.o365GetMessage(this.userEmail, messageId);

    return {
      id: msg.id,
      subject: msg.subject || '(No Subject)',
      from: msg.from?.emailAddress?.address || 'Unknown',
      receivedDateTime: msg.receivedDateTime,
      bodyPreview: msg.bodyPreview || '',
      body: msg.body?.content || '',
      bodyContentType: msg.body?.contentType === 'html' ? 'html' : 'text',
      isRead: msg.isRead,
      hasAttachments: msg.hasAttachments,
    };
  }

  async markAsRead(messageId: string): Promise<void> {
    await window.electron.o365MarkRead(this.userEmail, messageId);
  }

  async sendReply(messageId: string, replyText: string): Promise<void> {
    await window.electron.o365SendReply(this.userEmail, messageId, replyText);
  }

  async sendMessage(to: string, subject: string, body: string): Promise<void> {
    await window.electron.o365SendMessage(this.userEmail, to, subject, body);
  }
}

export const emailService = new EmailService();
