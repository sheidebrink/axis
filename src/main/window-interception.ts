import { BrowserWindow, ipcMain } from 'electron';

export function setupWindowInterception(mainWindow: BrowserWindow) {
  // Prevent OS-level windows from vendor webviews
  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Block all OS windows, route through IPC instead
    mainWindow.webContents.send('create-panel-from-url', {
      url: details.url,
      disposition: details.disposition,
    });

    return { action: 'deny' };
  });

  // Handle panel creation requests from renderer
  ipcMain.handle('create-panel', async (event, config) => {
    mainWindow.webContents.send('add-panel', config);
    return { success: true };
  });
}
