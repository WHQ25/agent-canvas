import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { startWebSocketServer, stopWebSocketServer, setResultHandler } from './ws-server';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Send command from WebSocket to renderer
export function sendCommandToRenderer(command: unknown): void {
  if (mainWindow) {
    mainWindow.webContents.send('canvas-command', command);
  }
}

// Handle result from renderer, send back via WebSocket
ipcMain.on('canvas-result', (_event, result) => {
  setResultHandler(result);
});

app.whenReady().then(() => {
  startWebSocketServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopWebSocketServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
