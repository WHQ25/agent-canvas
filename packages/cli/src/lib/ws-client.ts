import WebSocket from 'ws';
import { WS_PORT } from './protocol';

const WS_URL = `ws://localhost:${WS_PORT}`;

// Pending requests waiting for response
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}>();

export interface WsClient {
  ws: WebSocket;
  close: () => void;
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
}

let clientInstance: WsClient | null = null;

export function connectToCanvas(timeout = 5000): Promise<WsClient> {
  if (clientInstance && clientInstance.ws.readyState === WebSocket.OPEN) {
    return Promise.resolve(clientInstance);
  }

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

        // Handle pong for connection verification
        if (message.type === 'pong' && !clientInstance) {
          clientInstance = {
            ws,
            close: () => {
              ws.close();
              clientInstance = null;
            },
            send: <T>(request: { type: string; id: string; params?: unknown }): Promise<T> => {
              return new Promise((res, rej) => {
                pendingRequests.set(request.id, { resolve: res as (value: unknown) => void, reject: rej });
                ws.send(JSON.stringify(request));
              });
            },
          };
          resolve(clientInstance);
          return;
        }

        // Handle responses for pending requests
        if (message.id && pendingRequests.has(message.id)) {
          const pending = pendingRequests.get(message.id)!;
          pendingRequests.delete(message.id);
          pending.resolve(message);
        }
      } catch {
        // Ignore parse errors
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    ws.on('close', () => {
      clientInstance = null;
      // Reject all pending requests
      for (const [id, pending] of pendingRequests) {
        pending.reject(new Error('Connection closed'));
        pendingRequests.delete(id);
      }
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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
