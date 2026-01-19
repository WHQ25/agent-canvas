import { WebSocketServer, WebSocket } from 'ws';
import { WS_PORT, type Message, isMessage } from '../shared/protocol';

let wss: WebSocketServer | null = null;

export function startWebSocketServer(): WebSocketServer {
  if (wss) return wss;

  wss = new WebSocketServer({ port: WS_PORT });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

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
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  console.log(`WebSocket server started on port ${WS_PORT}`);
  return wss;
}

function handleMessage(ws: WebSocket, message: Message): void {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    case 'pong':
      // Received pong, connection is alive
      break;
  }
}

export function stopWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
  }
}
