import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Workspace } from './workspace/Workspace';
import { initializeAxis } from './initialize';
import { SplashScreen } from './components/SplashScreen';
import 'dockview/dist/styles/dockview.css';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeAxis().then(() => setInitialized(true));
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!initialized) return <div>Loading Axis...</div>;

  return <Workspace />;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
