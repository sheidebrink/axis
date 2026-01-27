import { panelRegistry } from './services/panel-registry';
import { pluginManager } from './plugins/plugin-manager';
import analyticsManifest from '../plugins/analytics/manifest';

export async function initializeAxis() {
  // Get CBCS URL from main process
  const cbcsUrl = await window.electron.getCbcsUrl();

  // Register native panels
  panelRegistry.register({
    id: 'native-chat',
    type: 'native',
    component: 'chat',
    title: 'Chat',
    capabilities: {
      canReadContext: true,
      canWriteContext: false,
      canEmitEvents: true,
      canReceiveEvents: true,
    },
  });

  panelRegistry.register({
    id: 'native-stats',
    type: 'native',
    component: 'stats',
    title: 'Statistics',
    capabilities: {
      canReadContext: true,
      canWriteContext: false,
      canEmitEvents: false,
      canReceiveEvents: true,
    },
  });

  panelRegistry.register({
    id: 'native-notes',
    type: 'native',
    component: 'notes',
    title: 'Notes',
    capabilities: {
      canReadContext: true,
      canWriteContext: true,
      canEmitEvents: false,
      canReceiveEvents: true,
    },
  });

  panelRegistry.register({
    id: 'native-email',
    type: 'native',
    component: 'email',
    title: 'Email',
    icon: '📧',
    capabilities: {
      canReadContext: true,
      canWriteContext: false,
      canEmitEvents: true,
      canReceiveEvents: true,
    },
  });

  // Register browser panel with environment-specific CBCS URL
  panelRegistry.register({
    id: 'native-browser',
    type: 'native',
    component: 'browser',
    title: 'Browser',
    icon: '🌐',
    capabilities: {
      canReadContext: true,
      canWriteContext: false,
      canEmitEvents: false,
      canReceiveEvents: false,
    },
    metadata: { defaultUrl: cbcsUrl },
  });

  // Register AI Insights panel
  panelRegistry.register({
    id: 'native-ai-insights',
    type: 'native',
    component: 'aiInsights',
    title: 'AI Insights',
    icon: '🤖',
    capabilities: {
      canReadContext: true,
      canWriteContext: false,
      canEmitEvents: false,
      canReceiveEvents: false,
    },
  });

  // Register plugins
  await pluginManager.register(analyticsManifest);
}
