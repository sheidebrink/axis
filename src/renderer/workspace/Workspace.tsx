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
  const dockviewRef = useRef<DockviewReact>(null);
  const [isReady, setIsReady] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    const api = dockviewRef.current?.api;
    if (!api) return;

    registerBuiltInCommands(api);

    // Track panel focus
    const disposable = api.onDidActivePanelChange((panel) => {
      if (panel) {
        panelFocusManager.recordFocus(panel.id);
        eventBus.emit('panel.focused', { panelId: panel.id });
      }
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

    restoreLayout();

    return () => {
      disposable.dispose();
      unsubscribe();
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
    setIsReady(true);
  };

  const addPanel = (config: any) => {
    const api = dockviewRef.current?.api;
    if (!api) return;

    api.addPanel({
      id: config.id,
      component: 'panelRenderer',
      params: { config },
      title: config.title,
    });
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
      // Apply role-based preset
      const preset = layoutPresetManager.getPresetForRole(role);
      if (preset) {
        layoutPresetManager.applyPreset(preset, dockviewRef.current?.api, panelRegistry);
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
        ref={dockviewRef}
        onReady={onReady}
        components={{
          panelRenderer: (props) => (
            <PanelRenderer
              config={props.params.config}
              panelId={props.api.id}
            />
          ),
        }}
        className="dockview-theme-dark"
      />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
};
