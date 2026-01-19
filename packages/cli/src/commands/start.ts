import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { connectToCanvas, isCanvasRunning, generateId } from '../lib/ws-client';
import type { LoadSceneResponse } from '../lib/protocol';

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

export async function start(filePath?: string): Promise<void> {
  // Validate file path if provided
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

    // Load file if specified
    if (filePath) {
      const absolutePath = resolve(filePath);
      console.log(`Loading file: ${absolutePath}`);

      try {
        const content = readFileSync(absolutePath, 'utf-8');
        const data = JSON.parse(content);

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
      } catch (err) {
        console.error(`Failed to parse file: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
    }

    client.close();
  } catch (err) {
    console.error('Failed to connect:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
