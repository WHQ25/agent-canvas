import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { MoveElementsResponse } from '../lib/protocol.js';

export interface MoveElementsOptions {
  elementIds: string;
  deltaX: number;
  deltaY: number;
}

// Minimal client interface for dependency injection
export interface MoveElementsClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface MoveElementsDeps {
  connectToCanvas: () => Promise<MoveElementsClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: MoveElementsDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function moveElements(options: MoveElementsOptions, deps: MoveElementsDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Parse comma-separated element IDs
  const elementIds = options.elementIds.split(',').map((s) => s.trim());

  const result = await client.send<MoveElementsResponse>({
    type: 'moveElements',
    id: deps.generateId(),
    params: { elementIds, deltaX: options.deltaX, deltaY: options.deltaY },
  });

  if (result.success) {
    deps.log(`Moved ${result.movedCount} element(s)`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
