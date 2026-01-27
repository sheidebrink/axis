export interface EmailPerformanceStats {
  email: string;
  totalEmails: number;
  totalEmailsSent: number;
  unreadEmails: number;
  unrepliedEmails: number;
  averageResponseTimeHours: number;
  minResponseTimeHours: number;
  maxResponseTimeHours: number;
  medianResponseTimeHours: number;
  emailsPendingReply: number;
  oldestUnrepliedEmailAgeHours: number;
  replyRate: number;
  multiTouchRate: number;
  reopenedConversations: number;
  emailsHandledPerDay: number;
  emailsUnreadOver48Hours: number;
  emailsUnrepliedOver72Hours: number;
  inboxGrowthRate: number;
  peakEmailArrivalHour: number;
  peakReplyHour: number;
}

class EmailStatsService {
  private userEmail = 'janustest@cb-sisco.com';

  async calculateStats(): Promise<EmailPerformanceStats> {
    const stats = await window.electron.o365CalculateStats(this.userEmail);
    return stats;
  }
}

export const emailStatsService = new EmailStatsService();
