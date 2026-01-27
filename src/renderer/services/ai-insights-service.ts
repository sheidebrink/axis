export interface EmailInsights {
  emailId: string;
  priorityScore: number; // 0-100
  category: string;
  sentiment: 'calm' | 'neutral' | 'concerned' | 'escalating' | 'critical';
  entities: {
    claimId?: string;
    incidentDate?: string;
    amount?: number;
    parties?: string[];
  };
  similarClaims: Array<{
    id: string;
    outcome: string;
    daysToClose: number;
    settlementAmount?: number;
  }>;
  recommendations: string[];
  predictedCloseDays: number;
  fraudIndicators: Array<{
    indicator: string;
    confidence: number;
  }>;
}

class AIInsightsService {
  private readonly mlServiceUrl = 'http://localhost:5000/api/ml';

  async analyzeEmail(emailId: string, subject: string, body: string, from: string): Promise<EmailInsights> {
    try {
      // Try ML service first
      const response = await fetch(`${this.mlServiceUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, subject, body, from }),
      });

      if (response.ok) {
        const data = await response.json();
        return this.mapMLResponse(data);
      }
    } catch (err) {
      console.warn('ML service unavailable, using fallback:', err);
    }

    // Fallback to mock analysis
    return this.mockAnalyze(emailId, subject, body, from);
  }

  private mapMLResponse(data: any): EmailInsights {
    return {
      emailId: data.emailId,
      priorityScore: data.priorityScore,
      category: data.category,
      sentiment: data.sentiment,
      entities: data.entities,
      similarClaims: data.similarClaims,
      recommendations: data.recommendations,
      predictedCloseDays: data.predictedCloseDays,
      fraudIndicators: data.fraudIndicators,
    };
  }

  private mockAnalyze(emailId: string, subject: string, body: string, from: string): EmailInsights {
    // Mock analysis - replace with ML.NET service call later
    const hasAttorney = body.toLowerCase().includes('attorney') || body.toLowerCase().includes('lawyer');
    const hasUrgent = subject.toLowerCase().includes('urgent') || body.toLowerCase().includes('urgent');
    const hasMedical = body.toLowerCase().includes('injury') || body.toLowerCase().includes('pain');
    
    let priorityScore = 50;
    if (hasAttorney) priorityScore += 30;
    if (hasUrgent) priorityScore += 20;
    if (hasMedical) priorityScore += 15;
    priorityScore = Math.min(100, priorityScore);

    let sentiment: EmailInsights['sentiment'] = 'neutral';
    if (body.toLowerCase().includes('unacceptable') || body.toLowerCase().includes('frustrated')) {
      sentiment = 'escalating';
    } else if (hasAttorney) {
      sentiment = 'concerned';
    } else if (hasUrgent) {
      sentiment = 'concerned';
    }

    // Extract claim ID (simple pattern matching)
    const claimMatch = body.match(/claim\s*#?\s*(\d+)/i) || subject.match(/claim\s*#?\s*(\d+)/i);
    const claimId = claimMatch ? claimMatch[1] : undefined;

    // Extract amount
    const amountMatch = body.match(/\$\s*([\d,]+)/);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : undefined;

    const recommendations: string[] = [];
    if (hasAttorney) recommendations.push('Flag for legal review');
    if (hasMedical) recommendations.push('Schedule medical review within 48h');
    if (priorityScore > 70) recommendations.push('Respond within 24 hours');
    if (amount && amount > 25000) recommendations.push('Consider reserve increase');

    return {
      emailId,
      priorityScore,
      category: hasMedical ? 'Medical - Injury' : hasAttorney ? 'Legal' : 'General',
      sentiment,
      entities: {
        claimId,
        amount,
        parties: [from],
      },
      similarClaims: [
        { id: '9876', outcome: 'Settled', daysToClose: 45, settlementAmount: 30000 },
        { id: '7654', outcome: 'Litigated', daysToClose: 180 },
      ],
      recommendations,
      predictedCloseDays: hasAttorney ? 120 : hasMedical ? 60 : 30,
      fraudIndicators: [],
    };
  }

  async analyzeInbox(emails: Array<{ id: string; subject: string; body: string; from: string }>): Promise<{
    highPriority: number;
    needsResponseToday: number;
    highRisk: number;
    avgPredictedDays: number;
  }> {
    const insights = await Promise.all(
      emails.map(e => this.analyzeEmail(e.id, e.subject, e.body || '', e.from))
    );

    return {
      highPriority: insights.filter(i => i.priorityScore > 70).length,
      needsResponseToday: insights.filter(i => i.priorityScore > 80).length,
      highRisk: insights.filter(i => i.sentiment === 'escalating' || i.sentiment === 'critical').length,
      avgPredictedDays: insights.reduce((sum, i) => sum + i.predictedCloseDays, 0) / insights.length,
    };
  }
}

export const aiInsightsService = new AIInsightsService();
