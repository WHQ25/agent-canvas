import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { SwitchCanvasParams, SwitchCanvasResponse } from '../lib/protocol.js';

export interface UseCanvasOptions {
  name: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface UseCanvasClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface UseCanvasDeps {
  connectToCanvas: () => Promise<UseCanvasClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: UseCanvasDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function useCanvas(options: UseCanvasOptions, deps: UseCanvasDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const params: SwitchCanvasParams = {
    name: options.name,
  };

  const result = await client.send<SwitchCanvasResponse>({
    type: 'switchCanvas',
    id: deps.generateId(),
    params,
  });

  if (result.success && result.canvas) {
    deps.log(`Switched to canvas "${result.canvas.name}"`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
