import React from 'react';

const AnalyticsPanel: React.FC<{ panelId: string; config: any }> = () => {
  return (
    <div style={{ padding: 16 }}>
      <h3>Analytics Dashboard</h3>
      <p>Plugin loaded successfully</p>
    </div>
  );
};

export default AnalyticsPanel;
