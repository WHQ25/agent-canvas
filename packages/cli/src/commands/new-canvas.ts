import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { CreateCanvasParams, CreateCanvasResponse } from '../lib/protocol.js';

export interface NewCanvasOptions {
  name: string;
  use?: boolean;
}

// Minimal client interface for dependency injection (only methods we need)
export interface NewCanvasClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface NewCanvasDeps {
  connectToCanvas: () => Promise<NewCanvasClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: NewCanvasDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function newCanvas(options: NewCanvasOptions, deps: NewCanvasDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const params: CreateCanvasParams = {
    name: options.name,
    switchTo: options.use ?? false,
  };

  const result = await client.send<CreateCanvasResponse>({
    type: 'createCanvas',
    id: deps.generateId(),
    params,
  });

  if (result.success && result.canvas) {
    const switched = options.use ? ' and switched to it' : '';
    deps.log(`Canvas "${result.canvas.name}" created${switched}`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
