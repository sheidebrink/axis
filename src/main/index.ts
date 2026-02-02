import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { join } from 'path';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { setupWindowInterception } from './window-interception';
import { createApplicationMenu } from './menu';
import { setupO365Auth } from './o365-handler';
import os from 'os';

let mainWindow: BrowserWindow | null = null;

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  displayId: number;
}

function getWindowStatePath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'window-state.json');
}

function saveWindowState(window: BrowserWindow): void {
  const bounds = window.getBounds();
  const display = screen.getDisplayMatching(bounds);
  
  const state: WindowState = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: window.isMaximized(),
    displayId: display.id,
  };

  try {
    const statePath = getWindowStatePath();
    const dir = join(statePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

function loadWindowState(): Partial<WindowState> | null {
  try {
    const statePath = getWindowStatePath();
    if (!existsSync(statePath)) return null;
    
    const state: WindowState = JSON.parse(readFileSync(statePath, 'utf-8'));
    
    // Verify the display still exists
    const displays = screen.getAllDisplays();
    const displayExists = displays.some(d => d.id === state.displayId);
    
    if (!displayExists) {
      // Display no longer exists, use primary display
      return { width: state.width, height: state.height };
    }
    
    return state;
  } catch (err) {
    console.error('Failed to load window state:', err);
    return null;
  }
}

function getCbcsUrl(): string {
  const env = process.env.AXIS_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return 'https://cbcs.ventivclient.com/ivos/login.jsp';
  }
  return 'https://test-cbcs.ventivclient.com/ivos/login.jsp';
}

function getEnvironment(): string {
  return process.env.AXIS_ENV || process.env.NODE_ENV || 'development';
}

app.whenReady().then(() => {
  const savedState = loadWindowState();
  
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: savedState?.width || 1400,
    height: savedState?.height || 900,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  // Restore position if available
  if (savedState?.x !== undefined && savedState?.y !== undefined) {
    windowOptions.x = savedState.x;
    windowOptions.y = savedState.y;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Restore maximized state
  if (savedState?.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on move, resize, or close
  mainWindow.on('close', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  mainWindow.on('moved', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  mainWindow.on('resized', () => {
    if (mainWindow) saveWindowState(mainWindow);
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

  // Handle status info request
  ipcMain.handle('get-status-info', () => ({
    environment: getEnvironment(),
    username: os.userInfo().username,
    version: app.getVersion(),
  }));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
