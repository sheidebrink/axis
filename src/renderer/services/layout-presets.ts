interface LayoutPreset {
  id: string;
  name: string;
  roles: string[];
  panels: Array<{
    configId: string;
    position: 'left' | 'center' | 'right' | 'bottom';
    size?: number;
  }>;
}

const presets: LayoutPreset[] = [
  {
    id: 'support-agent',
    name: 'Support Agent',
    roles: ['agent', 'support'],
    panels: [
      { configId: 'vendor-zendesk', position: 'center' },
      { configId: 'native-chat', position: 'right', size: 350 },
      { configId: 'native-notes', position: 'bottom', size: 200 },
    ]
  },
  {
    id: 'sales-rep',
    name: 'Sales Representative',
    roles: ['sales', 'account-manager'],
    panels: [
      { configId: 'vendor-salesforce', position: 'center' },
      { configId: 'native-stats', position: 'right', size: 300 },
      { configId: 'analytics.dashboard', position: 'bottom', size: 250 },
    ]
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    roles: ['analyst', 'data'],
    panels: [
      { configId: 'analytics.dashboard', position: 'center' },
      { configId: 'native-stats', position: 'right', size: 400 },
    ]
  },
];

class LayoutPresetManager {
  getPresetForRole(role: string): LayoutPreset | undefined {
    return presets.find(p => p.roles.includes(role));
  }

  applyPreset(preset: LayoutPreset, workspaceApi: any, panelRegistry: any): void {
    // Clear existing panels
    workspaceApi.clear();

    // Add panels based on preset
    preset.panels.forEach(({ configId, position, size }) => {
      const config = panelRegistry.get(configId);
      if (!config) return;

      workspaceApi.addPanel({
        id: `${configId}-${Date.now()}`,
        component: 'panelRenderer',
        params: { config },
        title: config.title,
        position: this.mapPosition(position, workspaceApi),
        size: size ? { width: size, height: size } : undefined,
      });
    });
  }

  private mapPosition(pos: string, api: any) {
    const panels = api.panels;
    if (panels.length === 0) return undefined;

    return {
      referencePanel: panels[panels.length - 1],
      direction: pos === 'right' ? 'right' : pos === 'bottom' ? 'below' : 'within',
    };
  }

  getAllPresets(): LayoutPreset[] {
    return presets;
  }
}

export const layoutPresetManager = new LayoutPresetManager();
