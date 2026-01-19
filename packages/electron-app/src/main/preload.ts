import { contextBridge, ipcRenderer } from 'electron';

export interface CanvasAPI {
  onCommand: (callback: (command: unknown) => void) => void;
  sendResult: (result: unknown) => void;
}

contextBridge.exposeInMainWorld('canvasAPI', {
  onCommand: (callback: (command: unknown) => void) => {
    // Remove any existing listeners to avoid duplicates (e.g., from HMR)
    ipcRenderer.removeAllListeners('canvas-command');
    ipcRenderer.on('canvas-command', (_event, command) => {
      callback(command);
    });
  },
  sendResult: (result: unknown) => {
    ipcRenderer.send('canvas-result', result);
  },
} satisfies CanvasAPI);
