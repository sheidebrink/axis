import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  createPanel: (config: any) => ipcRenderer.invoke('create-panel', config),
  
  onAddPanel: (callback: (config: any) => void) => {
    ipcRenderer.on('add-panel', (_, config) => callback(config));
  },

  onCreatePanelFromUrl: (callback: (data: any) => void) => {
    ipcRenderer.on('create-panel-from-url', (_, data) => callback(data));
  },

  onOpenPanel: (callback: (panelId: string) => void) => {
    ipcRenderer.on('open-panel', (_, panelId) => callback(panelId));
  },

  onToggleCommandPalette: (callback: () => void) => {
    ipcRenderer.on('toggle-command-palette', () => callback());
  },

  onResetLayout: (callback: () => void) => {
    ipcRenderer.on('reset-layout', () => callback());
  },

  getCbcsUrl: () => ipcRenderer.invoke('get-cbcs-url'),

  getStatusInfo: () => ipcRenderer.invoke('get-status-info'),

  // O365 API
  o365GetMessages: (userEmail: string, top: number) => 
    ipcRenderer.invoke('o365-get-messages', userEmail, top),
  
  o365GetMessage: (userEmail: string, messageId: string) => 
    ipcRenderer.invoke('o365-get-message', userEmail, messageId),
  
  o365MarkRead: (userEmail: string, messageId: string) => 
    ipcRenderer.invoke('o365-mark-read', userEmail, messageId),
  
  o365SendReply: (userEmail: string, messageId: string, comment: string) => 
    ipcRenderer.invoke('o365-send-reply', userEmail, messageId, comment),
  
  o365SendMessage: (userEmail: string, to: string, subject: string, body: string) => 
    ipcRenderer.invoke('o365-send-message', userEmail, to, subject, body),
  
  o365CalculateStats: (userEmail: string) => 
    ipcRenderer.invoke('o365-calculate-stats', userEmail),
});

declare global {
  interface Window {
    electron: {
      createPanel: (config: any) => Promise<{ success: boolean }>;
      onAddPanel: (callback: (config: any) => void) => void;
      onCreatePanelFromUrl: (callback: (data: any) => void) => void;
      onOpenPanel: (callback: (panelId: string) => void) => void;
      onToggleCommandPalette: (callback: () => void) => void;
      onResetLayout: (callback: () => void) => void;
      getCbcsUrl: () => Promise<string>;
      getStatusInfo: () => Promise<{ environment: string; username: string; version: string }>;
      o365GetMessages: (userEmail: string, top: number) => Promise<any>;
      o365GetMessage: (userEmail: string, messageId: string) => Promise<any>;
      o365MarkRead: (userEmail: string, messageId: string) => Promise<void>;
      o365SendReply: (userEmail: string, messageId: string, comment: string) => Promise<void>;
      o365SendMessage: (userEmail: string, to: string, subject: string, body: string) => Promise<void>;
      o365CalculateStats: (userEmail: string) => Promise<any>;
    };
  }
}
