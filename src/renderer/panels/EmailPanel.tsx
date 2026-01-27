import React, { useEffect, useState } from 'react';
import { emailService, EmailMessage } from '../services/email-service';
import { feedbackService } from '../services/feedback-service';
import { EmailStats } from '../components/EmailStats';

interface EmailPanelProps {
  panelId: string;
  config: any;
}

type View = 'inbox' | 'compose' | 'reply' | 'stats';

const EmailPanel: React.FC<EmailPanelProps> = ({ panelId }) => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [fullMessage, setFullMessage] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('inbox');
  
  // Compose/Reply state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'high-priority' | 'needs-response' | 'unread'>('all');

  const filteredMessages = messages.filter(msg => {
    if (filter === 'high-priority') {
      // Show emails tagged as High or with urgent keywords
      return selectedPriority[msg.id] === 'High' || 
             msg.subject.toLowerCase().includes('urgent') ||
             msg.subject.toLowerCase().includes('attorney');
    }
    if (filter === 'needs-response') {
      return !msg.isRead;
    }
    if (filter === 'unread') {
      return !msg.isRead;
    }
    return true;
  });

  const handleSetPriority = async (messageId: string, priority: 'High' | 'Medium' | 'Low') => {
    try {
      await feedbackService.setPriority(messageId, priority);
      setSelectedPriority(prev => ({ ...prev, [messageId]: priority }));
    } catch (err) {
      console.error('Failed to set priority:', err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const msgs = await emailService.getMessages();
      setMessages(msgs);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message: EmailMessage) => {
    setSelectedMessage(message);
    setView('inbox');
    
    try {
      const full = await emailService.getMessage(message.id);
      setFullMessage(full);
      
      if (!message.isRead) {
        await emailService.markAsRead(message.id);
        setMessages(prev =>
          prev.map(m => (m.id === message.id ? { ...m, isRead: true } : m))
        );
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCompose = () => {
    setView('compose');
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  const handleReply = () => {
    if (!fullMessage) return;
    setView('reply');
    setComposeTo(fullMessage.from);
    setComposeSubject(`Re: ${fullMessage.subject}`);
    setComposeBody('');
  };

  const handleSend = async () => {
    try {
      setSending(true);
      
      if (view === 'reply' && fullMessage) {
        await emailService.sendReply(fullMessage.id, composeBody);
      } else {
        await emailService.sendMessage(composeTo, composeSubject, composeBody);
      }
      
      setView('inbox');
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      await loadMessages();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading inbox...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div>Error: {error}</div>
        <button onClick={loadMessages}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.messageList}>
        <div style={styles.header}>
          <h3>Inbox</h3>
          <div style={styles.headerButtons}>
            <button onClick={handleCompose}>Compose</button>
            <button onClick={() => setView('stats')}>Stats</button>
            <button onClick={loadMessages}>Refresh</button>
          </div>
        </div>
        <div style={styles.filterBar}>
          <button 
            style={{ ...styles.filterButton, ...(filter === 'all' ? styles.filterActive : {}) }}
            onClick={() => setFilter('all')}
          >
            All ({messages.length})
          </button>
          <button 
            style={{ ...styles.filterButton, ...(filter === 'high-priority' ? styles.filterActive : {}) }}
            onClick={() => setFilter('high-priority')}
          >
            🔴 High Priority
          </button>
          <button 
            style={{ ...styles.filterButton, ...(filter === 'unread' ? styles.filterActive : {}) }}
            onClick={() => setFilter('unread')}
          >
            Unread ({messages.filter(m => !m.isRead).length})
          </button>
        </div>
        {filteredMessages.map(msg => (
          <div
            key={msg.id}
            style={{
              ...styles.messageItem,
              ...(msg.id === selectedMessage?.id ? styles.messageItemSelected : {}),
              ...(msg.isRead ? {} : styles.messageItemUnread),
            }}
            onClick={() => handleMessageClick(msg)}
          >
            <div style={styles.messageFrom}>{msg.from}</div>
            <div style={styles.messageSubject}>
              {msg.hasAttachments && '📎 '}
              {msg.subject}
            </div>
            <div style={styles.messagePreview}>{msg.bodyPreview}</div>
            <div style={styles.messageDate}>
              {new Date(msg.receivedDateTime).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {view === 'inbox' && fullMessage && (
        <div style={styles.messageDetail}>
          <div style={styles.messageDetailHeader}>
            <h3>{fullMessage.subject}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                style={{ ...styles.priorityButton, ...(selectedPriority[fullMessage.id] === 'High' ? styles.priorityHigh : {}) }}
                onClick={() => handleSetPriority(fullMessage.id, 'High')}
              >
                🔴 High
              </button>
              <button 
                style={{ ...styles.priorityButton, ...(selectedPriority[fullMessage.id] === 'Medium' ? styles.priorityMedium : {}) }}
                onClick={() => handleSetPriority(fullMessage.id, 'Medium')}
              >
                🟡 Medium
              </button>
              <button 
                style={{ ...styles.priorityButton, ...(selectedPriority[fullMessage.id] === 'Low' ? styles.priorityLow : {}) }}
                onClick={() => handleSetPriority(fullMessage.id, 'Low')}
              >
                🟢 Low
              </button>
              <button onClick={handleReply}>Reply</button>
            </div>
          </div>
          <div style={styles.messageDetailMeta}>
            <div>From: {fullMessage.from}</div>
            <div>{new Date(fullMessage.receivedDateTime).toLocaleString()}</div>
          </div>
          {fullMessage.bodyContentType === 'html' ? (
            <iframe
              srcDoc={fullMessage.body}
              style={styles.messageBodyIframe}
              sandbox="allow-same-origin"
            />
          ) : (
            <div style={styles.messageBody}>{fullMessage.body}</div>
          )}
        </div>
      )}

      {(view === 'compose' || view === 'reply') && (
        <div style={styles.composePanel}>
          <div style={styles.composeHeader}>
            <h3>{view === 'reply' ? 'Reply' : 'New Message'}</h3>
            <button onClick={() => setView('inbox')}>Cancel</button>
          </div>
          <div style={styles.composeForm}>
            <input
              style={styles.composeInput}
              placeholder="To"
              value={composeTo}
              onChange={e => setComposeTo(e.target.value)}
              disabled={view === 'reply'}
            />
            <input
              style={styles.composeInput}
              placeholder="Subject"
              value={composeSubject}
              onChange={e => setComposeSubject(e.target.value)}
              disabled={view === 'reply'}
            />
            <textarea
              style={styles.composeTextarea}
              placeholder="Message"
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
            />
            <button
              style={styles.sendButton}
              onClick={handleSend}
              disabled={sending || !composeTo || !composeBody}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {view === 'stats' && (
        <div style={styles.statsPanel}>
          <div style={styles.statsHeader}>
            <h3>Email Statistics</h3>
            <button onClick={() => setView('inbox')}>Back to Inbox</button>
          </div>
          <EmailStats />
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100%',
    background: '#1e1e1e',
    color: '#fff',
  },
  messageList: {
    width: 350,
    borderRight: '1px solid #333',
    overflowY: 'auto',
  },
  header: {
    padding: 16,
    borderBottom: '1px solid #333',
  },
  headerButtons: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  messageItem: {
    padding: 12,
    borderBottom: '1px solid #2d2d2d',
    cursor: 'pointer',
  },
  messageItemSelected: {
    background: '#094771',
  },
  messageItemUnread: {
    background: '#252525',
    fontWeight: 'bold',
  },
  messageFrom: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 4,
  },
  messageSubject: {
    fontSize: 14,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 12,
    color: '#888',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  messageDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  messageDetail: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  messageDetailHeader: {
    padding: 24,
    paddingBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #333',
  },
  messageDetailMeta: {
    padding: '12px 24px',
    fontSize: 13,
    color: '#aaa',
    borderBottom: '1px solid #333',
  },
  messageBody: {
    padding: 24,
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  messageBodyIframe: {
    flex: 1,
    border: 'none',
    background: '#fff',
  },
  composePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  composeHeader: {
    padding: 24,
    paddingBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #333',
  },
  composeForm: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 24,
    gap: 12,
  },
  composeInput: {
    padding: 12,
    background: '#2d2d2d',
    border: '1px solid #444',
    color: '#fff',
    fontSize: 14,
    borderRadius: 4,
  },
  composeTextarea: {
    flex: 1,
    padding: 12,
    background: '#2d2d2d',
    border: '1px solid #444',
    color: '#fff',
    fontSize: 14,
    borderRadius: 4,
    resize: 'none',
  },
  sendButton: {
    padding: 12,
    background: '#0e639c',
    border: 'none',
    color: '#fff',
    fontSize: 14,
    borderRadius: 4,
    cursor: 'pointer',
  },
  statsPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  statsHeader: {
    padding: 24,
    paddingBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #333',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#fff',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#f44',
    gap: 16,
  },
  priorityButton: {
    padding: '6px 12px',
    background: '#2d2d2d',
    border: '1px solid #444',
    color: '#fff',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer',
  },
  priorityHigh: {
    background: '#f44',
    borderColor: '#f44',
  },
  priorityMedium: {
    background: '#fa0',
    borderColor: '#fa0',
  },
  priorityLow: {
    background: '#4a4',
    borderColor: '#4a4',
  },
  filterBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    borderBottom: '1px solid #333',
    overflowX: 'auto',
  },
  filterButton: {
    padding: '6px 12px',
    background: '#2d2d2d',
    border: '1px solid #444',
    color: '#fff',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  filterActive: {
    background: '#094771',
    borderColor: '#0e639c',
  },
};

export default EmailPanel;
