import { PluginManifest } from '../../shared/types';
import { panelRegistry } from '../services/panel-registry';

class PluginManager {
  private plugins = new Map<string, PluginManifest>();
  private loaded = new Set<string>();

  async register(manifest: PluginManifest): Promise<void> {
    this.plugins.set(manifest.id, manifest);

    // Register plugin panels
    manifest.panels.forEach(panel => {
      panelRegistry.register({
        id: `${manifest.id}.${panel.id}`,
        type: 'plugin',
        title: panel.title,
        icon: panel.icon,
        capabilities: manifest.permissions,
        pluginId: manifest.id,
        version: manifest.version,
        entryPoint: manifest.entryPoint,
      });
    });
  }

  async load(pluginId: string): Promise<void> {
    if (this.loaded.has(pluginId)) return;

    const manifest = this.plugins.get(pluginId);
    if (!manifest) throw new Error(`Plugin ${pluginId} not found`);

    // Lazy load plugin module
    await import(`../../plugins/${pluginId}/${manifest.entryPoint}`);
    this.loaded.add(pluginId);
  }

  getManifest(pluginId: string): PluginManifest | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginManager = new PluginManager();
