class FeedbackService {
  private readonly mlServiceUrl = 'http://localhost:5000/api/feedback';
  private readonly userEmail = 'janustest@cb-sisco.com';

  async setPriority(emailId: string, priority: 'High' | 'Medium' | 'Low'): Promise<void> {
    await fetch(`${this.mlServiceUrl}/priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, userEmail: this.userEmail, priority }),
    });
  }

  async setNeedsResponse(emailId: string, needsResponse: boolean): Promise<void> {
    await fetch(`${this.mlServiceUrl}/needs-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, userEmail: this.userEmail, needsResponse }),
    });
  }

  async snoozeEmail(emailId: string, hours: number): Promise<void> {
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await fetch(`${this.mlServiceUrl}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, userEmail: this.userEmail, snoozedUntil }),
    });
  }

  async getAllFeedback(): Promise<Record<string, any>> {
    const response = await fetch(`${this.mlServiceUrl}/all?userEmail=${encodeURIComponent(this.userEmail)}`);
    return await response.json();
  }
}

export const feedbackService = new FeedbackService();
