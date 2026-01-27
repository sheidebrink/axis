# Axis - Desktop Workspace Platform

Enterprise-grade Electron workspace for vendor apps, native panels, and internal plugins.

## Architecture

### Core Abstractions

**Panel System** (`src/shared/types.ts`)
- Every UI surface is a Panel (webview, native, or plugin)
- Panels declare capabilities (read/write context, emit/receive events)
- Type-safe panel configurations

**Event Bus** (`src/renderer/services/event-bus.ts`)
- Decoupled cross-panel communication
- Type-safe event system with TypeScript generics
- Panels never directly reference each other

**Workspace Context** (`src/renderer/context/workspace-context.ts`)
- Global state: vendor, recordId, userRole, activeWorkflow
- Selective subscriptions prevent unnecessary re-renders
- React hooks: `useWorkspaceContext(key)`, `useWorkspaceContextKeys([keys])`

**Panel Registry** (`src/renderer/services/panel-registry.ts`)
- Dynamic panel registration
- Query by type or ID
- Supports runtime panel addition

**Plugin System** (`src/renderer/plugins/plugin-manager.ts`)
- Lazy-loaded internal apps
- Versioned manifests with permissions
- Isolated plugin contexts

### Panel Types

**Webview Panels** - Vendor web apps
- Session partitioning per vendor
- window.open interception → new panels
- Authentication/cookie preservation
- Example: Salesforce, Zendesk

**Native Panels** - React components
- Chat, Stats, Notes
- Subscribe to workspace context
- React to events from vendor panels

**Plugin Panels** - Internal apps
- Lazy loaded from `src/plugins/`
- Declare permissions in manifest
- Access workspace context via hooks

### Window Interception

**Main Process** (`src/main/window-interception.ts`)
- Blocks OS-level windows via `setWindowOpenHandler`
- Routes window.open through IPC

**Renderer** (`src/renderer/panels/WebviewPanel.tsx`)
- Intercepts `new-window` events from webviews
- Creates new panels instead of OS windows

### Layout Persistence

**Workspace** (`src/renderer/workspace/Workspace.tsx`)
- Integrates Dockview docking engine
- Saves layout to localStorage on unmount
- Restores panels and layout on launch
- Supports tabs, splits, floating panes

### Usage

**Register a Panel**
```typescript
panelRegistry.register({
  id: 'vendor-salesforce',
  type: 'webview',
  url: 'https://salesforce.com',
  partition: 'persist:salesforce',
  capabilities: {
    canReadContext: true,
    canWriteContext: true,
    canEmitEvents: true,
    canReceiveEvents: false,
  },
});
```

**Subscribe to Context**
```typescript
const recordId = useWorkspaceContext('recordId');
const { vendor, userRole } = useWorkspaceContextKeys(['vendor', 'userRole']);
```

**Emit Events**
```typescript
eventBus.emit('record.opened', { recordId: '123', vendor: 'salesforce' });
```

**Listen to Events**
```typescript
useEffect(() => {
  return eventBus.on('record.changed', (payload) => {
    console.log('Record changed:', payload);
  });
}, []);
```

**Create Plugin**
1. Add folder: `src/plugins/my-plugin/`
2. Create `manifest.ts` with permissions
3. Create `index.tsx` with React component
4. Register in `src/renderer/initialize.ts`

## Key Design Decisions

- **No direct panel coupling** - All communication via events/context
- **Type safety** - TypeScript throughout, generic event system
- **Selective re-renders** - Context hooks subscribe to specific keys
- **Session isolation** - Per-vendor webview partitions
- **Lazy loading** - Plugins loaded on-demand
- **Layout persistence** - Restore workspace state across sessions
