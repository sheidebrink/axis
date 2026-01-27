import { PanelConfig } from '../shared/types';

class PanelRegistry {
  private panels = new Map<string, PanelConfig>();

  register(config: PanelConfig): void {
    if (this.panels.has(config.id)) {
      console.warn(`Panel ${config.id} already registered, overwriting`);
    }
    this.panels.set(config.id, config);
  }

  unregister(id: string): void {
    this.panels.delete(id);
  }

  get(id: string): PanelConfig | undefined {
    return this.panels.get(id);
  }

  getAll(): PanelConfig[] {
    return Array.from(this.panels.values());
  }

  getByType(type: PanelConfig['type']): PanelConfig[] {
    return this.getAll().filter(p => p.type === type);
  }
}

export const panelRegistry = new PanelRegistry();
