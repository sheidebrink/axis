import { panelRegistry } from './panel-registry';
import { workspaceContext } from '../context/workspace-context';

export interface Command {
  id: string;
  label: string;
  category: string;
  keybinding?: string;
  when?: () => boolean;
  execute: () => void;
}

class CommandRegistry {
  private commands = new Map<string, Command>();
  private keybindings = new Map<string, string>(); // key combo -> command id

  register(command: Command): void {
    this.commands.set(command.id, command);
    if (command.keybinding) {
      this.keybindings.set(command.keybinding, command.id);
    }
  }

  execute(commandId: string): void {
    const cmd = this.commands.get(commandId);
    if (!cmd) return;
    if (cmd.when && !cmd.when()) return;
    cmd.execute();
  }

  search(query: string): Command[] {
    const lower = query.toLowerCase();
    return Array.from(this.commands.values())
      .filter(cmd => !cmd.when || cmd.when())
      .filter(cmd => 
        cmd.label.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
      )
      .slice(0, 10);
  }

  handleKeyPress(e: KeyboardEvent): boolean {
    const combo = [
      e.ctrlKey && 'Ctrl',
      e.shiftKey && 'Shift',
      e.altKey && 'Alt',
      e.key
    ].filter(Boolean).join('+');

    const commandId = this.keybindings.get(combo);
    if (commandId) {
      e.preventDefault();
      this.execute(commandId);
      return true;
    }
    return false;
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }
}

export const commandRegistry = new CommandRegistry();

// Register built-in commands
export function registerBuiltInCommands(workspaceApi: any) {
  commandRegistry.register({
    id: 'panel.focus.next',
    label: 'Focus Next Panel',
    category: 'Navigation',
    keybinding: 'Ctrl+Tab',
    execute: () => {
      const panels = workspaceApi.panels;
      const active = workspaceApi.activePanel;
      const idx = panels.indexOf(active);
      const next = panels[(idx + 1) % panels.length];
      next?.api.setActive();
    }
  });

  commandRegistry.register({
    id: 'panel.focus.previous',
    label: 'Focus Previous Panel',
    category: 'Navigation',
    keybinding: 'Ctrl+Shift+Tab',
    execute: () => {
      const panels = workspaceApi.panels;
      const active = workspaceApi.activePanel;
      const idx = panels.indexOf(active);
      const prev = panels[(idx - 1 + panels.length) % panels.length];
      prev?.api.setActive();
    }
  });

  commandRegistry.register({
    id: 'panel.close',
    label: 'Close Active Panel',
    category: 'Panel',
    keybinding: 'Ctrl+w',
    execute: () => workspaceApi.activePanel?.api.close()
  });

  commandRegistry.register({
    id: 'panel.closeOthers',
    label: 'Close Other Panels',
    category: 'Panel',
    execute: () => {
      const active = workspaceApi.activePanel;
      workspaceApi.panels.forEach((p: any) => {
        if (p !== active) p.api.close();
      });
    }
  });

  commandRegistry.register({
    id: 'panel.split.horizontal',
    label: 'Split Panel Horizontally',
    category: 'Layout',
    keybinding: 'Ctrl+\\',
    execute: () => {
      const active = workspaceApi.activePanel;
      if (active) {
        workspaceApi.addPanel({
          id: `split-${Date.now()}`,
          component: 'panelRenderer',
          position: { referencePanel: active, direction: 'right' }
        });
      }
    }
  });

  // Dynamic panel opening
  panelRegistry.getAll().forEach(config => {
    commandRegistry.register({
      id: `panel.open.${config.id}`,
      label: `Open ${config.title}`,
      category: 'Panels',
      execute: () => {
        workspaceApi.addPanel({
          id: `${config.id}-${Date.now()}`,
          component: 'panelRenderer',
          params: { config },
          title: config.title
        });
      }
    });
  });

  commandRegistry.register({
    id: 'layout.save',
    label: 'Save Current Layout',
    category: 'Layout',
    keybinding: 'Ctrl+Shift+s',
    execute: () => {
      const role = workspaceContext.get('userRole');
      const layout = workspaceApi.toJSON();
      localStorage.setItem(`axis-layout-${role}`, JSON.stringify(layout));
    }
  });

  commandRegistry.register({
    id: 'layout.reset',
    label: 'Reset to Default Layout',
    category: 'Layout',
    execute: () => {
      const role = workspaceContext.get('userRole');
      localStorage.removeItem(`axis-layout-${role}`);
      window.location.reload();
    }
  });
}
