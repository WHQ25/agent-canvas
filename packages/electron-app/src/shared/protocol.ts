export const WS_PORT = 7890;

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
}

export type Message = PingMessage | PongMessage;

export function isMessage(data: unknown): data is Message {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as { type?: unknown };
  return msg.type === 'ping' || msg.type === 'pong';
}
