import { exec } from 'child_process';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { promisify } from 'util';
import { connectToCanvas, generateId } from '../lib/ws-client.js';
import { startServer, isBrowserServerRunning, isBrowserConnected } from '../server/index.js';
import type { LoadSceneResponse } from '../lib/protocol.js';

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

export async function start(filePath?: string): Promise<void> {
  if (filePath) {
    const absolutePath = resolve(filePath);
    if (!existsSync(absolutePath)) {
      console.error(`File not found: ${absolutePath}`);
      process.exit(1);
    }
  }

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
