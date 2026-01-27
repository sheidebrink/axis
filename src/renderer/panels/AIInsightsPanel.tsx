import React, { useEffect, useState } from 'react';
import { emailService, EmailMessage } from '../services/email-service';
import { aiInsightsService, EmailInsights } from '../services/ai-insights-service';

interface AIInsightsPanelProps {
  panelId: string;
  config: any;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = () => {
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [insights, setInsights] = useState<EmailInsights | null>(null);
  const [inboxStats, setInboxStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<EmailMessage[]>([]);

  useEffect(() => {
    loadInboxStats();
  }, []);

  const loadInboxStats = async () => {
    try {
      setLoading(true);
      const msgs = await emailService.getMessages(50);
      setMessages(msgs);
      
      const stats = await aiInsightsService.analyzeInbox(
        msgs.map(m => ({ id: m.id, subject: m.subject, body: m.bodyPreview, from: m.from }))
      );
      setInboxStats(stats);
    } catch (err) {
      console.error('Failed to load inbox stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEmail = async (message: EmailMessage) => {
    setSelectedEmail(message);
    setLoading(true);
    try {
      const fullMsg = await emailService.getMessage(message.id);
      const analysis = await aiInsightsService.analyzeEmail(
        fullMsg.id,
        fullMsg.subject,
        fullMsg.body || fullMsg.bodyPreview,
        fullMsg.from
      );
      setInsights(analysis);
    } catch (err) {
      console.error('Failed to analyze email:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return '#f44';
    if (score >= 60) return '#fa0';
    return '#4a4';
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'calm': return '😊';
      case 'neutral': return '😐';
      case 'concerned': return '😟';
      case 'escalating': return '⚠️';
      case 'critical': return '🚨';
      default: return '😐';
    }
  };

  if (loading && !insights) {
    return <div style={styles.loading}>Analyzing emails...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>📊 Inbox Overview</h3>
        {inboxStats && (
          <div style={styles.statsGrid}>
            <StatCard label="High Priority" value={inboxStats.highPriority} color="#f44" />
            <StatCard label="Needs Response Today" value={inboxStats.needsResponseToday} color="#fa0" />
            <StatCard label="High Risk" value={inboxStats.highRisk} color="#f44" />
            <StatCard label="Avg Days to Close" value={Math.round(inboxStats.avgPredictedDays)} />
          </div>
        )}
        
        <h4 style={styles.sectionTitle}>Recent Emails</h4>
        <div style={styles.emailList}>
          {messages.slice(0, 10).map(msg => (
            <div
              key={msg.id}
              style={{
                ...styles.emailItem,
                ...(selectedEmail?.id === msg.id ? styles.emailItemSelected : {}),
              }}
              onClick={() => analyzeEmail(msg)}
            >
              <div style={styles.emailSubject}>{msg.subject}</div>
              <div style={styles.emailFrom}>{msg.from}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.main}>
        {!insights ? (
          <div style={styles.placeholder}>
            <h2>🤖 AI Claims Assistant</h2>
            <p>Select an email to see AI-powered insights</p>
          </div>
        ) : (
          <>
            <div style={styles.header}>
              <h2>AI Insights</h2>
              <div style={styles.priorityBadge}>
                <span style={{ ...styles.priorityScore, color: getPriorityColor(insights.priorityScore) }}>
                  {insights.priorityScore}/100
                </span>
                <span style={styles.priorityLabel}>Priority</span>
              </div>
            </div>

            <div style={styles.content}>
              <Section title="Classification">
                <InfoRow label="Category" value={insights.category} />
                <InfoRow label="Sentiment" value={`${getSentimentEmoji(insights.sentiment)} ${insights.sentiment}`} />
                <InfoRow label="Predicted Close" value={`${insights.predictedCloseDays} days`} />
              </Section>

              {insights.entities.claimId && (
                <Section title="Extracted Information">
                  {insights.entities.claimId && <InfoRow label="Claim ID" value={`#${insights.entities.claimId}`} />}
                  {insights.entities.amount && <InfoRow label="Amount" value={`$${insights.entities.amount.toLocaleString()}`} />}
                  {insights.entities.incidentDate && <InfoRow label="Incident Date" value={insights.entities.incidentDate} />}
                </Section>
              )}

              {insights.recommendations.length > 0 && (
                <Section title="Recommended Actions">
                  {insights.recommendations.map((rec, i) => (
                    <div key={i} style={styles.recommendation}>
                      ✓ {rec}
                    </div>
                  ))}
                </Section>
              )}

              {insights.similarClaims.length > 0 && (
                <Section title="Similar Claims">
                  {insights.similarClaims.map(claim => (
                    <div key={claim.id} style={styles.similarClaim}>
                      <div style={styles.claimId}>Claim #{claim.id}</div>
                      <div style={styles.claimDetails}>
                        {claim.outcome} • {claim.daysToClose} days
                        {claim.settlementAmount && ` • $${claim.settlementAmount.toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={styles.section}>
    <h3 style={styles.sectionTitle}>{title}</h3>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}:</span>
    <span style={styles.infoValue}>{value}</span>
  </div>
);

const StatCard: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statValue, color: color || '#e0e0e0' }}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100%',
    background: '#1e1e1e',
    color: '#e0e0e0',
  },
  sidebar: {
    width: 300,
    borderRight: '1px solid #333',
    padding: 16,
    overflowY: 'auto',
  },
  sidebarTitle: {
    margin: '0 0 16px 0',
    fontSize: 16,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
  },
  emailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  emailItem: {
    padding: 12,
    background: '#2d2d2d',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  emailItemSelected: {
    background: '#094771',
  },
  emailSubject: {
    fontSize: 13,
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emailFrom: {
    fontSize: 11,
    color: '#888',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#888',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottom: '1px solid #333',
  },
  priorityBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  priorityScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  priorityLabel: {
    fontSize: 12,
    color: '#888',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: '#fff',
  },
  infoRow: {
    display: 'flex',
    padding: '8px 0',
    borderBottom: '1px solid #2d2d2d',
  },
  infoLabel: {
    width: 150,
    color: '#888',
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
  },
  recommendation: {
    padding: 12,
    background: '#2d2d2d',
    borderRadius: 4,
    marginBottom: 8,
    fontSize: 13,
  },
  similarClaim: {
    padding: 12,
    background: '#2d2d2d',
    borderRadius: 4,
    marginBottom: 8,
  },
  claimId: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  claimDetails: {
    fontSize: 12,
    color: '#888',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#888',
  },
};

export default AIInsightsPanel;
