import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { setupWindowInterception } from './window-interception';
import { createApplicationMenu } from './menu';
import { setupO365Auth } from './o365-handler';

let mainWindow: BrowserWindow | null = null;

function getCbcsUrl(): string {
  const env = process.env.AXIS_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return 'https://cbcs.ventivclient.com/ivos/login.jsp';
  }
  return 'https://test-cbcs.ventivclient.com/ivos/login.jsp';
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setupWindowInterception(mainWindow);
  createApplicationMenu(mainWindow);
  
  // Load O365 config from settings.json
  const settingsPath = join(process.cwd(), 'settings.json');
  if (existsSync(settingsPath)) {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    if (settings.vendors?.O365) {
      setupO365Auth(settings.vendors.O365);
    }
  }

  // Handle CBCS URL request
  ipcMain.handle('get-cbcs-url', () => getCbcsUrl());

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
