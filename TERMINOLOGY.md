# Axis Terminology

## Core Concepts

### Panel
**Definition:** A single dockable UI surface within the workspace. The atomic unit of the layout system.

**Types:**
- Webview Panel (vendor apps)
- Native Panel (React components)
- Plugin Panel (internal tools)

**Properties:**
- Has unique ID
- Declares capabilities (read/write context, emit/receive events)
- Can be focused, closed, split, moved
- Managed by PanelRegistry

**Examples:**
- A Salesforce webview
- The Chat sidebar
- An Analytics dashboard plugin

**NOT a Panel:**
- The entire workspace window
- A modal dialog
- A dropdown menu

---

### App
**Ambiguous term - DO NOT USE in code or documentation.**

**Use instead:**
- "Vendor App" for third-party web applications
- "Internal Tool" for plugins we build
- "Native Panel" for built-in UI components

---

### Vendor App
**Definition:** A third-party web application embedded via Electron webview.

**Characteristics:**
- Runs in isolated session partition
- Has its own authentication/cookies
- We don't control the code
- Intercepts window.open → creates new panels

**Examples:**
- Salesforce
- Zendesk
- ServiceNow
- HubSpot

**Implementation:** `WebviewPanelConfig` with `partition` property

**NOT a Vendor App:**
- Our internal analytics tool (that's an Internal Tool)
- The chat panel (that's a Native Panel)

---

### Internal Tool
**Definition:** A plugin we build and maintain, loaded from `src/plugins/`.

**Characteristics:**
- Lazy-loaded on demand
- Declares permissions in manifest
- Can access workspace context via hooks
- Versioned independently

**Examples:**
- Analytics dashboard
- Custom reporting tool
- Workflow automation UI

**Implementation:** `PluginPanelConfig` with `pluginId` and `entryPoint`

**NOT an Internal Tool:**
- Chat panel (that's a Native Panel - part of core)
- Salesforce (that's a Vendor App)

---

### Native Panel
**Definition:** A core React component built into Axis, not lazy-loaded.

**Characteristics:**
- Part of core bundle
- Always available
- Tightly integrated with workspace
- Examples: Chat, Stats, Notes

**Implementation:** `NativePanelConfig` with `component` identifier

**When to use:**
- Core functionality needed at startup
- Tight coupling with workspace required
- Performance-critical UI

**When to use Internal Tool instead:**
- Optional functionality
- Can be lazy-loaded
- Versioned separately

---

### Workspace
**Definition:** The entire Axis application window containing all panels and layout.

**Responsibilities:**
- Manages docking layout engine
- Handles keyboard shortcuts
- Persists/restores layout
- Provides global context

**Singleton:** Only one workspace per window

**NOT the Workspace:**
- Individual panels
- The layout configuration (that's Layout)
- Global state (that's Context)

---

### Layout
**Definition:** The spatial arrangement and visibility of panels within the workspace.

**Includes:**
- Panel positions (left, center, right, bottom)
- Split directions (horizontal/vertical)
- Tab groups
- Panel sizes
- Floating panes

**Persisted as:** JSON in localStorage per user role

**NOT the Layout:**
- Panel content or state
- Workspace context (vendor, recordId)
- User preferences (theme, font size)

---

### Context
**Definition:** Global application state shared across all panels.

**Current keys:**
- `vendor` - Active vendor (e.g., "salesforce")
- `recordId` - Current record being viewed
- `userRole` - User's role (e.g., "agent", "sales")
- `activeWorkflow` - Current workflow state

**Characteristics:**
- Observable (panels subscribe to changes)
- Selective subscriptions (prevents unnecessary re-renders)
- Emits events on change

**NOT Context:**
- Panel-local state (e.g., chat message input)
- Layout configuration
- User preferences

---

## Usage in Code

### ✅ Correct
```typescript
// Clear terminology
const panel = panelRegistry.get('vendor-salesforce');
const internalTool = pluginManager.load('analytics');
const nativePanel = { type: 'native', component: 'chat' };

// Workspace context
const recordId = useWorkspaceContext('recordId');

// Layout operations
workspaceApi.saveLayout();
```

### ❌ Incorrect
```typescript
// Ambiguous
const app = getApp('salesforce'); // Which type?
const tool = loadTool('chat'); // Native or plugin?

// Confusing
const context = getLayout(); // Layout ≠ Context
const workspace = getCurrentPanel(); // Panel ≠ Workspace
```

---

## Decision Tree

**"Should this be a Native Panel or Internal Tool?"**
- Needed at startup? → Native Panel
- Optional/lazy-loadable? → Internal Tool
- Core workspace feature? → Native Panel
- Domain-specific feature? → Internal Tool

**"Is this a Vendor App or Internal Tool?"**
- Do we control the code? → Internal Tool
- Third-party web app? → Vendor App
- Needs session isolation? → Vendor App

**"Is this Context or Layout?"**
- Affects panel content/behavior? → Context
- Affects panel position/visibility? → Layout
- Shared across panels? → Context
- Per-user arrangement? → Layout

---

## File Naming Conventions

```
src/renderer/panels/          # All panel implementations
  WebviewPanel.tsx            # Vendor app container
  ChatPanel.tsx               # Native panel
  PanelRenderer.tsx           # Panel factory

src/plugins/                  # Internal tools
  analytics/
  reporting/

src/renderer/context/         # Workspace context
  workspace-context.ts

src/renderer/workspace/       # Workspace & layout
  Workspace.tsx
  layout-presets.ts
```

---

## Communication

**Team discussions:**
- "Let's add a new vendor app" (not "new app")
- "The chat native panel" (not "chat app")
- "Our analytics internal tool" (not "analytics plugin" or "analytics app")
- "The workspace context" (not "global state" or "app context")
- "Save the layout" (not "save the workspace")

**Code reviews:**
- Flag usage of "app" without qualifier
- Require "vendor app", "internal tool", or "native panel"
- Distinguish "context" from "layout" clearly
