import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { DeleteElementsResponse } from '../lib/protocol.js';

export interface DeleteElementsOptions {
  elementIds: string;
}

// Minimal client interface for dependency injection
export interface DeleteElementsClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface DeleteElementsDeps {
  connectToCanvas: () => Promise<DeleteElementsClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: DeleteElementsDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function deleteElements(options: DeleteElementsOptions, deps: DeleteElementsDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Parse comma-separated element IDs
  const elementIds = options.elementIds.split(',').map((s) => s.trim());

  const result = await client.send<DeleteElementsResponse>({
    type: 'deleteElements',
    id: deps.generateId(),
    params: { elementIds },
  });

  if (result.success) {
    deps.log(`Deleted ${result.deletedCount} element(s)`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
