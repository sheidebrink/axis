import React, { useEffect, useState } from 'react';
import { emailStatsService, EmailPerformanceStats } from '../services/email-stats-service';

export const EmailStats: React.FC = () => {
  const [stats, setStats] = useState<EmailPerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await emailStatsService.calculateStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading stats...</div>;
  if (!stats) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Performance Stats (Last 30 Days)</h3>
        <button onClick={loadStats}>Refresh</button>
      </div>
      
      <div style={styles.grid}>
        <StatCard label="Total Emails Received" value={stats.totalEmails} />
        <StatCard label="Total Emails Sent" value={stats.totalEmailsSent} />
        <StatCard label="Unread Emails" value={stats.unreadEmails} highlight={stats.unreadEmails > 10} />
        <StatCard label="Unreplied Emails (24h+)" value={stats.unrepliedEmails} highlight={stats.unrepliedEmails > 5} />
        
        <StatCard label="Average Response Time" value={`${stats.averageResponseTimeHours.toFixed(1)}h`} />
        <StatCard label="Min Response Time" value={`${stats.minResponseTimeHours.toFixed(1)}h`} />
        <StatCard label="Max Response Time" value={`${stats.maxResponseTimeHours.toFixed(1)}h`} />
        <StatCard label="Median Response Time" value={`${stats.medianResponseTimeHours.toFixed(1)}h`} />
        
        <StatCard label="Emails Unread Over 48 Hours" value={stats.emailsUnreadOver48Hours} highlight={stats.emailsUnreadOver48Hours > 0} />
        <StatCard label="Emails Unreplied Over 72 Hours" value={stats.emailsUnrepliedOver72Hours} highlight={stats.emailsUnrepliedOver72Hours > 0} />
        
        <StatCard label="Reply Rate" value={`${stats.replyRate.toFixed(1)}%`} />
        <StatCard label="Emails Handled Per Day" value={stats.emailsHandledPerDay.toFixed(1)} />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div style={{ ...styles.card, ...(highlight ? styles.cardHighlight : {}) }}>
    <div style={styles.cardLabel}>{label}</div>
    <div style={styles.cardValue}>{value}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    background: '#1e1e1e',
    color: '#fff',
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#2d2d2d',
    padding: 16,
    borderRadius: 8,
    border: '1px solid #444',
  },
  cardHighlight: {
    border: '1px solid #f44',
    background: '#3d2d2d',
  },
  cardLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#fff',
  },
};
