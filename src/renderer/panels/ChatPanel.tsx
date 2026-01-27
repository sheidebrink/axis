import React, { useEffect, useState } from 'react';
import { useWorkspaceContextKeys } from '../context/workspace-context';
import { eventBus } from '../services/event-bus';

interface ChatPanelProps {
  panelId: string;
  config: any;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ panelId }) => {
  const { recordId, vendor } = useWorkspaceContextKeys(['recordId', 'vendor']);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to record events
    const unsubscribe = eventBus.on('record.opened', (payload) => {
      setMessages(prev => [...prev, `Record opened: ${payload.recordId}`]);
    });

    return unsubscribe;
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>Chat Panel</h3>
      <div>Context: {vendor} / {recordId || 'No record'}</div>
      <div style={{ marginTop: 16 }}>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
    </div>
  );
};

export default ChatPanel;
