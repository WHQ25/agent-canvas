import WebSocket from 'ws';

const WS_PORT = 7890;
const WS_URL = `ws://localhost:${WS_PORT}`;

export interface WsClient {
  ws: WebSocket;
  close: () => void;
}

export function connectToCanvas(timeout = 5000): Promise<WsClient> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, timeout);

    ws.on('open', () => {
      clearTimeout(timer);
      // Send ping to verify connection
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'pong') {
          resolve({
            ws,
            close: () => ws.close(),
          });
        }
      } catch {
        // Ignore parse errors
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function isCanvasRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
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
