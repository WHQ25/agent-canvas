import { WebSocketServer, WebSocket } from 'ws';
import { WS_PORT, type Message, type ResponseMessage, isMessage } from '../shared/protocol';

let wss: WebSocketServer | null = null;
let currentClient: WebSocket | null = null;

// Pending requests waiting for response from renderer
const pendingRequests = new Map<string, WebSocket>();

export function startWebSocketServer(): WebSocketServer {
  if (wss) return wss;

  wss = new WebSocketServer({ port: WS_PORT });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    currentClient = ws;

    ws.on('message', (data: Buffer) => {
      try {
        const message: unknown = JSON.parse(data.toString());
        if (isMessage(message)) {
          handleMessage(ws, message);
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (currentClient === ws) {
        currentClient = null;
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  console.log(`WebSocket server started on port ${WS_PORT}`);
  return wss;
}

function handleMessage(ws: WebSocket, message: Message): void {
  // Handle ping/pong locally
  if (message.type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong' }));
    return;
  }
  if (message.type === 'pong') {
    return;
  }

  // Forward all other messages (with id) to renderer
  if ('id' in message) {
    pendingRequests.set(message.id, ws);
    const { sendCommandToRenderer } = require('./index');
    sendCommandToRenderer(message);
  }
}

// Called from index.ts when renderer sends back result
export function setResultHandler(result: ResponseMessage): void {
  if ('id' in result) {
    const ws = pendingRequests.get(result.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(result));
      pendingRequests.delete(result.id);
    }
  }
}

export function stopWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
  }
  currentClient = null;
  pendingRequests.clear();
}
