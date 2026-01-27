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
      label: 'Panels',
      submenu: [
        {
          label: 'Email',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            console.log('Menu: Email clicked');
            mainWindow.webContents.send('open-panel', 'native-email');
          },
        },
        {
          label: 'Chat',
          click: () => {
            mainWindow.webContents.send('open-panel', 'native-chat');
          },
        },
        {
          label: 'Stats',
          click: () => {
            mainWindow.webContents.send('open-panel', 'native-stats');
          },
        },
        {
          label: 'Notes',
          click: () => {
            mainWindow.webContents.send('open-panel', 'native-notes');
          },
        },
        { type: 'separator' },
        {
          label: 'Salesforce',
          click: () => {
            mainWindow.webContents.send('open-panel', 'vendor-salesforce');
          },
        },
        {
          label: 'Zendesk',
          click: () => {
            mainWindow.webContents.send('open-panel', 'vendor-zendesk');
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
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
