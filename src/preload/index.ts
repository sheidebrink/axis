import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  createPanel: (config: any) => ipcRenderer.invoke('create-panel', config),
  
  onAddPanel: (callback: (config: any) => void) => {
    ipcRenderer.on('add-panel', (_, config) => callback(config));
  },

  onCreatePanelFromUrl: (callback: (data: any) => void) => {
    ipcRenderer.on('create-panel-from-url', (_, data) => callback(data));
  },
});

declare global {
  interface Window {
    electron: {
      createPanel: (config: any) => Promise<{ success: boolean }>;
      onAddPanel: (callback: (config: any) => void) => void;
      onCreatePanelFromUrl: (callback: (data: any) => void) => void;
    };
  }
}
