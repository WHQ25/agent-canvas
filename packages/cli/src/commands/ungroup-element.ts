import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { UngroupElementParams, UngroupElementResponse } from '../lib/protocol.js';

export interface UngroupElementOptions {
  elementId: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface UngroupClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface UngroupElementDeps {
  connectToCanvas: () => Promise<UngroupClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: UngroupElementDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function ungroupElement(options: UngroupElementOptions, deps: UngroupElementDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Build params
  const params: UngroupElementParams = {
    elementId: options.elementId,
  };

  const result = await client.send<UngroupElementResponse>({
    type: 'ungroupElement',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log('Element ungrouped');
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
