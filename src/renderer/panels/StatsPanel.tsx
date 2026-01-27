import React, { useEffect, useState } from 'react';
import { useWorkspaceContext } from '../context/workspace-context';
import { eventBus } from '../services/event-bus';

interface StatsPanelProps {
  panelId: string;
  config: any;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ panelId }) => {
  const recordId = useWorkspaceContext('recordId');
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    const unsubscribe = eventBus.on('record.changed', () => {
      setChangeCount(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>Stats Panel</h3>
      <div>Active Record: {recordId || 'None'}</div>
      <div>Changes: {changeCount}</div>
    </div>
  );
};

export default StatsPanel;
