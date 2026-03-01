import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { startServer, isBrowserServerRunning, isBrowserConnected } from '../server/index.js';
import { getHttpPort } from '../lib/config.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

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

function findWebAppDir(): string {
  const possiblePaths = [
    join(__dirname, '../../../web-app'),
    join(__dirname, '../../../../packages/web-app'),
  ];
  for (const p of possiblePaths) {
    if (existsSync(join(p, 'package.json'))) {
      return p;
    }
  }
  throw new Error('web-app package not found. --dev mode must be run from the source repository.');
}

export async function start(options?: { dev?: boolean; port?: number; httpPort?: number }): Promise<void> {
  if (options?.port) {
    process.env.AGENT_CANVAS_WS_PORT = String(options.port);
  }
  if (options?.httpPort) {
    process.env.AGENT_CANVAS_HTTP_PORT = String(options.httpPort);
  }

  if (options?.dev) {
    if (!process.env.AGENT_CANVAS_WS_PORT) {
      process.env.AGENT_CANVAS_WS_PORT = '7900';
    }

    console.log('Starting dev mode...');
    await startServer({ wsOnly: true });

    const webAppDir = findWebAppDir();
    const viteProcess = spawn('npx', ['vite', '--host'], {
      cwd: webAppDir,
      env: { ...process.env, VITE_WS_PORT: process.env.AGENT_CANVAS_WS_PORT },
      stdio: 'pipe',
    });

    // Parse Vite output to get URL, then open browser
    let opened = false;
    viteProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      process.stdout.write(output);

      if (!opened) {
        // Vite prints "Local: http://localhost:5173/" — extract the URL
        const match = output.match(/Local:\s+(https?:\/\/\S+)/);
        if (match) {
          opened = true;
          openBrowser(match[1]);
        }
      }
    });

    viteProcess.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data);
    });

    viteProcess.on('close', (code) => {
      console.log(`Vite dev server exited with code ${code}`);
      process.exit(code ?? 0);
    });

    // Cleanup: kill Vite on Ctrl+C
    const cleanup = () => {
      viteProcess.kill();
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    console.log('\nDev mode is ready. Press Ctrl+C to stop.');
    await new Promise(() => {}); // Block forever
    return;
  }

  const running = await isBrowserServerRunning();

  if (!running) {
    console.log('Starting canvas server...');
    await startServer();
  }

  // Give existing browser tabs a moment to reconnect (browser reconnects every 1s)
  await new Promise((r) => setTimeout(r, 1500));

  const httpPort = getHttpPort();
  const browserConnected = await isBrowserConnected();
  if (browserConnected) {
    console.log(`Canvas already running at http://localhost:${httpPort}`);
  } else {
    console.log('Opening browser...');
    await openBrowser(`http://localhost:${httpPort}`);
  }

  // Keep the server running
  console.log('\nCanvas is ready. Press Ctrl+C to stop.');
  await new Promise(() => {}); // Block forever
}
