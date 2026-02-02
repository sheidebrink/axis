import React, { useEffect, useRef, useState } from 'react';
import { DockviewReact, DockviewReadyEvent } from 'dockview';
import { PanelRenderer } from '../panels/PanelRenderer';
import { CommandPalette } from '../components/CommandPalette';
import { panelRegistry } from '../services/panel-registry';
import { eventBus } from '../services/event-bus';
import { commandRegistry, registerBuiltInCommands } from '../services/command-registry';
import { layoutPresetManager } from '../services/layout-presets';
import { panelFocusManager } from '../services/panel-focus-manager';
import { workspaceContext } from '../context/workspace-context';
import { SerializedLayout } from '../shared/types';

export const Workspace: React.FC = () => {
  const dockviewRef = useRef<DockviewReadyEvent | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('isReady changed:', isReady);
    if (!isReady) return;

    const api = dockviewRef.current?.api;
    console.log('Dockview API:', api);
    if (!api) return;

    // Wait a bit for panel registry to be populated
    setTimeout(() => {
      registerBuiltInCommands(api);
    }, 100);

    // Track panel focus
    const disposable = api.onDidActivePanelChange((panel) => {
      if (panel) {
        panelFocusManager.recordFocus(panel.id);
        eventBus.emit('panel.focused', { panelId: panel.id });
      }
    });

    // Listen for panel collapse events
    const unsubscribeCollapse = eventBus.on('panel.collapsed' as any, (payload: any) => {
      console.log('Workspace received panel.collapsed:', payload);
      setCollapsedPanels(prev => {
        const next = new Set(prev);
        if (payload.collapsed) {
          next.add(payload.panelId);
        } else {
          next.delete(payload.panelId);
        }
        console.log('Updated collapsed panels:', Array.from(next));
        return next;
      });
    });

    // Listen for panel creation
    const unsubscribe = eventBus.on('record.opened', (payload) => {
      const config = panelRegistry.get(`vendor-${payload.vendor}`);
      if (config && config.type === 'webview') {
        addPanel({
          ...config,
          id: `${config.id}-${Date.now()}`,
          url: `${config.url}/${payload.recordId}`,
        });
      }
    });

    // Menu IPC listeners - set up after initialization
    if (window.electron) {
      window.electron.onOpenPanel((panelId) => {
        console.log('Opening panel:', panelId);
        const config = panelRegistry.get(panelId);
        console.log('Config found:', config);
        if (config) {
          const newPanel = { ...config, id: `${config.id}-${Date.now()}` };
          console.log('Adding panel:', newPanel);
          addPanel(newPanel);
        }
      });

      window.electron.onToggleCommandPalette(() => {
        setPaletteOpen(prev => !prev);
      });

      window.electron.onResetLayout(() => {
        const role = workspaceContext.get('userRole') || 'default';
        localStorage.removeItem(`axis-layout-${role}`);
        window.location.reload();
      });
    }

    restoreLayout();

    return () => {
      disposable.dispose();
      unsubscribe();
      unsubscribeCollapse();
    };
  }, [isReady]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      // Directional navigation
      if (e.ctrlKey && e.altKey) {
        const api = dockviewRef.current?.api;
        if (!api) return;

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          panelFocusManager.focusByDirection('up', api);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          panelFocusManager.focusByDirection('down', api);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          panelFocusManager.focusByDirection('left', api);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          panelFocusManager.focusByDirection('right', api);
        }
        return;
      }

      // Let command registry handle other shortcuts
      commandRegistry.handleKeyPress(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onReady = (event: DockviewReadyEvent) => {
    console.log('Dockview ready!');
    dockviewRef.current = event;
    setIsReady(true);
  };

  const addPanel = (config: any) => {
    const api = dockviewRef.current?.api;
    console.log('addPanel called, api:', !!api, 'config:', config);
    if (!api) return;

    api.addPanel({
      id: config.id,
      component: 'panelRenderer',
      params: { config },
      title: config.title,
    });
    console.log('Panel added to dockview');
  };

  const saveLayout = () => {
    const api = dockviewRef.current?.api;
    if (!api) return;

    const role = workspaceContext.get('userRole') || 'default';
    const layout: SerializedLayout = {
      version: '1.0',
      panels: Array.from(api.panels).map(panel => ({
        id: panel.id,
        config: panel.params.config,
      })),
      layout: api.toJSON(),
    };

    localStorage.setItem(`axis-layout-${role}`, JSON.stringify(layout));
  };

  const restoreLayout = () => {
    const role = workspaceContext.get('userRole') || 'default';
    const saved = localStorage.getItem(`axis-layout-${role}`);
    
    if (saved) {
      const layout: SerializedLayout = JSON.parse(saved);
      const api = dockviewRef.current?.api;
      if (!api) return;

      layout.panels.forEach(({ id, config }) => {
        api.addPanel({
          id,
          component: 'panelRenderer',
          params: { config },
          title: config.title,
        });
      });

      api.fromJSON(layout.layout);
    } else {
      // Apply role-based preset or default panels
      const preset = layoutPresetManager.getPresetForRole(role);
      if (preset) {
        layoutPresetManager.applyPreset(preset, dockviewRef.current?.api, panelRegistry);
      } else {
        // Default: add browser panel
        const browserConfig = panelRegistry.get('native-browser');
        if (browserConfig) {
          addPanel(browserConfig);
        }
      }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => saveLayout();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      saveLayout();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <>
      <DockviewReact
        onReady={onReady}
        components={{
          panelRenderer: (props) => (
            <PanelRenderer
              config={props.params.config}
              panelId={props.api.id}
              api={props.api}
            />
          ),
        }}
        tabComponents={{
          tab: (props) => {
            const isCollapsed = collapsedPanels.has(props.api.id);
            console.log('Rendering tab for', props.api.id, 'collapsed:', isCollapsed);
            return (
              <div style={{ 
                display: isCollapsed ? 'none' : 'flex',
                alignItems: 'center', 
                gap: 6,
              }}>
                {props.params.config.icon && <span>{props.params.config.icon}</span>}
                <span>{props.params.config.title}</span>
              </div>
            );
          },
        }}
        watermarkComponent={() => null}
        className="dockview-theme-dark"
      />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
};
