import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { RotateElementsResponse } from '../lib/protocol.js';

export interface RotateElementsOptions {
  elementIds: string;
  angle: number;
}

// Minimal client interface for dependency injection
export interface RotateElementsClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface RotateElementsDeps {
  connectToCanvas: () => Promise<RotateElementsClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: RotateElementsDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function rotateElements(options: RotateElementsOptions, deps: RotateElementsDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Parse comma-separated element IDs
  const elementIds = options.elementIds.split(',').map((s) => s.trim());

  const result = await client.send<RotateElementsResponse>({
    type: 'rotateElements',
    id: deps.generateId(),
    params: { elementIds, angle: options.angle },
  });

  if (result.success) {
    deps.log(`Rotated ${result.rotatedCount} element(s)`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
