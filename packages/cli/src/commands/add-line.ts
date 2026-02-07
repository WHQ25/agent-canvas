import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { AddLineParams, AddLineResponse } from '../lib/protocol.js';

export interface AddLineOptions {
  x: number;
  y: number;
  endX: number;
  endY: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  note?: string;
  animated?: boolean;
}

// Minimal client interface for dependency injection (only methods we need)
export interface LineClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface AddLineDeps {
  connectToCanvas: () => Promise<LineClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: AddLineDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function addLine(options: AddLineOptions, deps: AddLineDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Build params
  const params: AddLineParams = {
    x: options.x,
    y: options.y,
    endX: options.endX,
    endY: options.endY,
    strokeColor: options.strokeColor,
    strokeWidth: options.strokeWidth,
    strokeStyle: options.strokeStyle,
    customData: options.note ? { note: options.note } : undefined,
    animated: options.animated,
  };

  const result = await client.send<AddLineResponse>({
    type: 'addLine',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log(`Line created (id: ${result.elementId})`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
