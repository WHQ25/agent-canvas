import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { ResizeElementsParams, ResizeElementsResponse } from '../lib/protocol.js';

export interface ResizeElementsOptions {
  elementIds: string[];
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

// Minimal client interface for dependency injection (only methods we need)
export interface ResizeClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface ResizeElementsDeps {
  connectToCanvas: () => Promise<ResizeClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: ResizeElementsDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function resizeElements(options: ResizeElementsOptions, deps: ResizeElementsDeps = defaultDeps): Promise<void> {
  const top = options.top ?? 0;
  const bottom = options.bottom ?? 0;
  const left = options.left ?? 0;
  const right = options.right ?? 0;

  if (top === 0 && bottom === 0 && left === 0 && right === 0) {
    deps.error('At least one of --top, --bottom, --left, --right must be specified');
    deps.exit(1);
    return;
  }

  const client = await deps.connectToCanvas();

  // Build params
  const params: ResizeElementsParams = {
    elementIds: options.elementIds,
    top,
    bottom,
    left,
    right,
  };

  const result = await client.send<ResizeElementsResponse>({
    type: 'resizeElements',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log(`Resized ${result.resizedCount} element(s)`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
