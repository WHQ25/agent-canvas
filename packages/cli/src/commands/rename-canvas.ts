import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { RenameCanvasParams, RenameCanvasResponse } from '../lib/protocol.js';

export interface RenameCanvasOptions {
  newName: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface RenameCanvasClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface RenameCanvasDeps {
  connectToCanvas: () => Promise<RenameCanvasClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: RenameCanvasDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function renameCanvas(options: RenameCanvasOptions, deps: RenameCanvasDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const params: RenameCanvasParams = {
    newName: options.newName,
  };

  const result = await client.send<RenameCanvasResponse>({
    type: 'renameCanvas',
    id: deps.generateId(),
    params,
  });

  if (result.success && result.canvas) {
    deps.log(`Canvas renamed to "${result.canvas.name}"`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
