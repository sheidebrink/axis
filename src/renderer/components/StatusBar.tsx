import React, { useEffect, useState } from 'react';

export const StatusBar: React.FC = () => {
  const [environment, setEnvironment] = useState('');
  const [username, setUsername] = useState('');
  const [version, setVersion] = useState('');

  useEffect(() => {
    const loadStatus = async () => {
      const status = await window.electron.getStatusInfo();
      setEnvironment(status.environment);
      setUsername(status.username);
      setVersion(status.version);
    };
    loadStatus();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.item}>
        <span style={styles.label}>Environment:</span>
        <span style={styles.value}>{environment.toUpperCase()}</span>
      </div>
      <div style={styles.separator} />
      <div style={styles.item}>
        <span style={styles.label}>User:</span>
        <span style={styles.value}>{username}</span>
      </div>
      <div style={styles.separator} />
      <div style={styles.item}>
        <span style={styles.label}>Version:</span>
        <span style={styles.value}>{version}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '4px 16px',
    background: '#252525',
    borderTop: '1px solid #333',
    fontSize: 12,
    color: '#aaa',
    height: 28,
  },
  item: {
    display: 'flex',
    gap: 6,
  },
  label: {
    color: '#888',
  },
  value: {
    color: '#e0e0e0',
    fontWeight: 500,
  },
  separator: {
    width: 1,
    height: 16,
    background: '#444',
  },
};
