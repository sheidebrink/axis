import { app, Menu, BrowserWindow } from 'electron';

export function createApplicationMenu(mainWindow: BrowserWindow) {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Browser',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('open-panel', 'native-browser');
          },
        },
      ],
    },
    {
      label: 'Email',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            console.log('Menu: Email clicked');
            mainWindow.webContents.send('open-panel', 'native-email');
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow.webContents.send('toggle-command-palette');
          },
        },
        { type: 'separator' },
        {
          label: 'Reset Layout',
          click: () => {
            mainWindow.webContents.send('reset-layout');
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
