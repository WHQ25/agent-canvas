import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { ClearCanvasResponse } from '../lib/protocol.js';

// Minimal client interface for dependency injection
export interface ClearClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface ClearDeps {
  connectToCanvas: () => Promise<ClearClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: ClearDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function clear(deps: ClearDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const result = await client.send<ClearCanvasResponse>({
    type: 'clearCanvas',
    id: deps.generateId(),
  });

  if (result.success) {
    deps.log('Canvas cleared');
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
