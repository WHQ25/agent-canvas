import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { WS_PORT } from '../lib/protocol.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HTTP_PORT = 7891;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

// Track connections
let browserClient: WebSocket | null = null;
const pendingRequests = new Map<string, WebSocket>();

function getStaticDir(): string {
  // Try to find static files
  const possiblePaths = [
    // Production: bundled in cli package
    join(__dirname, '../static'),           // From dist/server -> dist/static
    join(__dirname, '../../static'),        // Alternative
    // Development: from web-app package
    join(__dirname, '../../../web-app/dist'),
    join(__dirname, '../../../../packages/web-app/dist'),
  ];

  for (const p of possiblePaths) {
    if (existsSync(join(p, 'index.html'))) {
      return p;
    }
  }

  throw new Error('Static files not found. Please run "bun run build" first.');
}

export function startServer(): Promise<{ httpUrl: string; wsPort: number; close: () => void }> {
  return new Promise((resolve) => {
    const staticDir = getStaticDir();
    console.log(`Serving static files from: ${staticDir}`);

    // HTTP Server for static files
    const httpServer = createServer((req, res) => {
      let filePath = req.url || '/';

      // Remove query string
      filePath = filePath.split('?')[0];

      // Default to index.html
      if (filePath === '/') {
        filePath = '/index.html';
      }

      const fullPath = join(staticDir, filePath);

      if (existsSync(fullPath)) {
        const ext = extname(fullPath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const content = readFileSync(fullPath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } else {
        // For SPA, fallback to index.html for non-asset paths
        const indexPath = join(staticDir, 'index.html');
        if (existsSync(indexPath) && !filePath.includes('.')) {
          const content = readFileSync(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      }
    });

    // WebSocket Server
    const wss = new WebSocketServer({ port: WS_PORT });

    wss.on('connection', (ws) => {
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          // Browser identification
          if (message.type === 'browserConnect') {
            console.log('Browser connected');
            browserClient = ws;
            return;
          }

          // Handle ping/pong for CLI clients
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          // If this is from browser (response), forward to CLI client
          if (message.id && pendingRequests.has(message.id)) {
            const cliClient = pendingRequests.get(message.id)!;
            pendingRequests.delete(message.id);
            if (cliClient.readyState === WebSocket.OPEN) {
              cliClient.send(JSON.stringify(message));
            }
            return;
          }

          // CLI command - forward to browser
          if (message.type && message.id && browserClient && browserClient.readyState === WebSocket.OPEN) {
            pendingRequests.set(message.id, ws);
            browserClient.send(JSON.stringify(message));
          } else if (!browserClient || browserClient.readyState !== WebSocket.OPEN) {
            // No browser connected
            ws.send(JSON.stringify({
              id: message.id,
              success: false,
              error: 'Browser not connected. Please open the canvas in your browser.',
            }));
          }
        } catch {
          // Ignore parse errors
        }
      });

      ws.on('close', () => {
        if (ws === browserClient) {
          console.log('Browser disconnected');
          browserClient = null;
        }
      });
    });

    httpServer.listen(HTTP_PORT, () => {
      const httpUrl = `http://localhost:${HTTP_PORT}`;
      console.log(`Canvas server running:`);
      console.log(`  - Web UI: ${httpUrl}`);
      console.log(`  - WebSocket: ws://localhost:${WS_PORT}`);

      resolve({
        httpUrl,
        wsPort: WS_PORT,
        close: () => {
          wss.close();
          httpServer.close();
        },
      });
    });
  });
}

export function isBrowserServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    const timer = setTimeout(() => {
      ws.close();
      resolve(false);
    }, 1000);

    ws.on('open', () => {
      clearTimeout(timer);
      ws.close();
      resolve(true);
    });

    ws.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}
