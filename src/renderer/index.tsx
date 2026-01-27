import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Workspace } from './workspace/Workspace';
import { initializeAxis } from './initialize';
import 'dockview/dist/styles/dockview.css';

const App: React.FC = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeAxis().then(() => setInitialized(true));
  }, []);

  if (!initialized) return <div>Loading Axis...</div>;

  return <Workspace />;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
