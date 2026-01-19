import { spawn, exec } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { promisify } from 'util';
import { connectToCanvas, isCanvasRunning, generateId } from '../lib/ws-client';
import { startServer, isBrowserServerRunning } from '../server';
import type { LoadSceneResponse } from '../lib/protocol';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

function getElectronAppPath(): string {
  return resolve(__dirname, '../../../electron-app');
}

async function launchElectronApp(): Promise<void> {
  const appPath = getElectronAppPath();

  const child = spawn('bun', ['run', 'dev'], {
    cwd: appPath,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();

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

async function loadFile(filePath: string): Promise<void> {
  const absolutePath = resolve(filePath);
  console.log(`Loading file: ${absolutePath}`);

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    const data = JSON.parse(content);

    const client = await connectToCanvas();
    const result = await client.send<LoadSceneResponse>({
      type: 'loadScene',
      id: generateId(),
      params: {
        elements: data.elements || [],
        appState: data.appState,
        files: data.files,
      },
    });

    if (result.success) {
      console.log(`Loaded ${result.elementCount} elements from ${filePath}`);
    } else {
      console.error(`Failed to load file: ${result.error}`);
      process.exit(1);
    }
    client.close();
  } catch (err) {
    console.error(`Failed to parse file: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

// Browser mode (default)
export async function startBrowser(filePath?: string): Promise<void> {
  if (filePath) {
    const absolutePath = resolve(filePath);
    if (!existsSync(absolutePath)) {
      console.error(`File not found: ${absolutePath}`);
      process.exit(1);
    }
  }

  const running = await isBrowserServerRunning();

  if (running) {
    console.log('Canvas server already running');
    console.log('Opening browser...');
    await openBrowser('http://localhost:7891');
  } else {
    console.log('Starting canvas server...');
    const { httpUrl } = await startServer();
    console.log('Opening browser...');
    await openBrowser(httpUrl);
  }

  // Wait for browser to connect, then load file if specified
  if (filePath) {
    console.log('Waiting for browser to connect...');
    const maxRetries = 30;
    const retryInterval = 500;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((r) => setTimeout(r, retryInterval));
      try {
        await loadFile(filePath);
        break;
      } catch {
        if (i === maxRetries - 1) {
          console.error('Timeout waiting for browser to connect');
          process.exit(1);
        }
      }
    }
  }

  // Keep the server running
  console.log('\nCanvas is ready. Press Ctrl+C to stop.');
  await new Promise(() => {}); // Block forever
}

// Electron app mode (--app)
export async function startApp(filePath?: string): Promise<void> {
  if (filePath) {
    const absolutePath = resolve(filePath);
    if (!existsSync(absolutePath)) {
      console.error(`File not found: ${absolutePath}`);
      process.exit(1);
    }
  }

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

    if (filePath) {
      await loadFile(filePath);
    }

    client.close();
  } catch (err) {
    console.error('Failed to connect:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

// Legacy export for backward compatibility
export async function start(filePath?: string): Promise<void> {
  return startBrowser(filePath);
}
