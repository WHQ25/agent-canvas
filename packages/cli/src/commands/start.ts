import { exec } from 'child_process';
import { promisify } from 'util';
import { startServer, isBrowserServerRunning, isBrowserConnected } from '../server/index.js';

const execAsync = promisify(exec);

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      await execAsync(`open "${url}"`);
    } else if (platform === 'win32') {
      await execAsync(`start "" "${url}"`);
    } else {
      await execAsync(`xdg-open "${url}"`);
    }
  } catch {
    console.log(`Please open ${url} in your browser`);
  }
}

export async function start(): Promise<void> {
  const running = await isBrowserServerRunning();

  if (!running) {
    console.log('Starting canvas server...');
    await startServer();
  }

  // Give existing browser tabs a moment to reconnect (browser reconnects every 1s)
  await new Promise((r) => setTimeout(r, 1500));

  const browserConnected = await isBrowserConnected();
  if (browserConnected) {
    console.log('Canvas already running at http://localhost:7891');
  } else {
    console.log('Opening browser...');
    await openBrowser('http://localhost:7891');
  }

  // Keep the server running
  console.log('\nCanvas is ready. Press Ctrl+C to stop.');
  await new Promise(() => {}); // Block forever
}
