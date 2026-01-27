import React, { lazy, Suspense } from 'react';
import { PanelConfig } from '../shared/types';
import WebviewPanel from './WebviewPanel';

// Native panel component map
const nativeComponents: Record<string, React.LazyExoticComponent<any>> = {
  chat: lazy(() => import('./ChatPanel')),
  stats: lazy(() => import('./StatsPanel')),
  notes: lazy(() => import('./NotesPanel')),
  email: lazy(() => import('./EmailPanel')),
  browser: lazy(() => import('./BrowserPanel')),
  aiInsights: lazy(() => import('./AIInsightsPanel')),
};

interface PanelRendererProps {
  config: PanelConfig;
  panelId: string;
}

export const PanelRenderer: React.FC<PanelRendererProps> = ({ config, panelId }) => {
  if (config.type === 'webview') {
    return <WebviewPanel config={config} panelId={panelId} />;
  }

  if (config.type === 'native') {
    const Component = nativeComponents[config.component];
    if (!Component) {
      return <div>Unknown native panel: {config.component}</div>;
    }
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Component panelId={panelId} config={config} />
      </Suspense>
    );
  }

  if (config.type === 'plugin') {
    return <PluginPanel config={config} panelId={panelId} />;
  }

  return <div>Unknown panel type</div>;
};

// Plugin panel loader
const PluginPanel: React.FC<{ config: PanelConfig; panelId: string }> = ({ config, panelId }) => {
  if (config.type !== 'plugin') return null;

  const Component = lazy(() => 
    /* @vite-ignore */
    import(`../../plugins/${config.pluginId}/${config.entryPoint}`)
  );

  return (
    <Suspense fallback={<div>Loading plugin...</div>}>
      <Component panelId={panelId} config={config} />
    </Suspense>
  );
};
