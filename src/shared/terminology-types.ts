/**
 * TERMINOLOGY ENFORCEMENT
 * 
 * These types enforce Axis terminology at compile-time.
 * See TERMINOLOGY.md for definitions.
 */

// Panel Types - The three kinds of panels
export type PanelType = 'webview' | 'native' | 'plugin';

// Vendor App - Third-party web application
export interface VendorAppConfig {
  readonly kind: 'vendor-app'; // Discriminator
  id: string;
  title: string;
  url: string;
  partition: string; // Session isolation
  vendor: string; // e.g., "salesforce", "zendesk"
}

// Internal Tool - Plugin we build
export interface InternalToolConfig {
  readonly kind: 'internal-tool'; // Discriminator
  id: string;
  title: string;
  pluginId: string;
  version: string;
  entryPoint: string;
  permissions: PanelCapabilities;
}

// Native Panel - Core React component
export interface NativePanelConfig {
  readonly kind: 'native-panel'; // Discriminator
  id: string;
  title: string;
  component: 'chat' | 'stats' | 'notes'; // Exhaustive list
}

// Panel - Union of all panel types
export type PanelConfig = VendorAppConfig | InternalToolConfig | NativePanelConfig;

// Workspace Context - Global shared state
export interface WorkspaceContext {
  vendor: string | null;
  recordId: string | null;
  userRole: string | null;
  activeWorkflow: string | null;
}

export type ContextKey = keyof WorkspaceContext;

// Layout - Spatial arrangement of panels
export interface WorkspaceLayout {
  version: string;
  panels: Array<{
    id: string;
    config: PanelConfig;
  }>;
  dockviewState: any; // Docking engine specific
}

// Panel Capabilities
export interface PanelCapabilities {
  canReadContext: boolean;
  canWriteContext: boolean;
  canEmitEvents: boolean;
  canReceiveEvents: boolean;
}

// Type guards for runtime checks
export function isVendorApp(config: PanelConfig): config is VendorAppConfig {
  return config.kind === 'vendor-app';
}

export function isInternalTool(config: PanelConfig): config is InternalToolConfig {
  return config.kind === 'internal-tool';
}

export function isNativePanel(config: PanelConfig): config is NativePanelConfig {
  return config.kind === 'native-panel';
}

// Deprecated - DO NOT USE
/** @deprecated Use VendorAppConfig, InternalToolConfig, or NativePanelConfig */
export type AppConfig = never;

/** @deprecated Use WorkspaceContext */
export type GlobalState = never;

/** @deprecated Use WorkspaceLayout */
export type WorkspaceState = never;
