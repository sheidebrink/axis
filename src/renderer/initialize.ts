import { panelRegistry } from './services/panel-registry';
import { pluginManager } from './plugins/plugin-manager';
import analyticsManifest from '../plugins/analytics/manifest';

export async function initializeAxis() {
  // Register vendor webview panels
  panelRegistry.register({
    id: 'vendor-salesforce',
    type: 'webview',
    title: 'Salesforce',
    url: 'https://salesforce.com',
    partition: 'persist:salesforce',
    capabilities: {
      canReadContext: true,
      canWriteContext: true,
      canEmitEvents: true,
      canReceiveEvents: false,
    },
    metadata: { vendor: 'salesforce' },
  });

  panelRegistry.register({
    id: 'vendor-zendesk',
    type: 'webview',
    title: 'Zendesk',
    url: 'https://zendesk.com',
    partition: 'persist:zendesk',
    capabilities: {
      canReadContext: true,
      canWriteContext: true,
      canEmitEvents: true,
      canReceiveEvents: false,
    },
    metadata: { vendor: 'zendesk' },
  });

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

  // Register plugins
  await pluginManager.register(analyticsManifest);
}
