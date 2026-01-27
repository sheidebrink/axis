// Core Panel Types
export type PanelType = 'webview' | 'native' | 'plugin';

export interface PanelCapabilities {
  canReadContext: boolean;
  canWriteContext: boolean;
  canEmitEvents: boolean;
  canReceiveEvents: boolean;
}

export interface PanelDescriptor {
  id: string;
  type: PanelType;
  title: string;
  icon?: string;
  capabilities: PanelCapabilities;
  metadata?: Record<string, any>;
}

export interface WebviewPanelConfig extends PanelDescriptor {
  type: 'webview';
  url: string;
  partition?: string; // Session isolation
  preload?: string;
}

export interface NativePanelConfig extends PanelDescriptor {
  type: 'native';
  component: string; // Component identifier
}

export interface PluginPanelConfig extends PanelDescriptor {
  type: 'plugin';
  pluginId: string;
  version: string;
  entryPoint: string;
}

export type PanelConfig = WebviewPanelConfig | NativePanelConfig | PluginPanelConfig;

// Workspace Context
export interface WorkspaceContext {
  vendor: string | null;
  recordId: string | null;
  userRole: string | null;
  activeWorkflow: string | null;
}

export type ContextKey = keyof WorkspaceContext;

// Event System
export interface EventMap {
  'record.opened': { recordId: string; vendor: string };
  'record.changed': { recordId: string; field: string; value: any };
  'record.closed': { recordId: string };
  'context.updated': { key: ContextKey; value: any };
  'panel.focused': { panelId: string };
  'workflow.started': { workflowId: string };
}

export type EventType = keyof EventMap;
export type EventPayload<T extends EventType> = EventMap[T];

// Layout Persistence
export interface SerializedLayout {
  version: string;
  panels: Array<{
    id: string;
    config: PanelConfig;
  }>;
  layout: any; // Docking engine specific
}

// Plugin System
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  entryPoint: string;
  permissions: PanelCapabilities;
  panels: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
}
