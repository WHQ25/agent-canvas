import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connectToCanvas, isCanvasRunning } from '../lib/ws-client';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getElectronAppPath(): string {
  // In development, go up from cli/src/commands to packages/electron-app
  return resolve(__dirname, '../../../electron-app');
}

async function launchElectronApp(): Promise<void> {
  const appPath = getElectronAppPath();

  // Start electron app in detached mode
  const child = spawn('bun', ['run', 'dev'], {
    cwd: appPath,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();

  // Wait for the app to start
  const maxRetries = 30;
  const retryInterval = 500;

  for (let i = 0; i < maxRetries; i++) {
    await new Promise((r) => setTimeout(r, retryInterval));
    if (await isCanvasRunning()) {
      return;
    }
  }

  throw new Error('Failed to start electron app');
}

export async function start(): Promise<void> {
  console.log('Checking if canvas app is running...');

  const running = await isCanvasRunning();

  if (!running) {
    console.log('Starting canvas app...');
    await launchElectronApp();
  }

  console.log('Connecting to canvas app...');

  try {
    const client = await connectToCanvas();
    console.log('Connected to canvas app');

    // Keep the connection alive
    // For MVP, we just verify connection works and exit
    client.close();
  } catch (err) {
    console.error('Failed to connect:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
