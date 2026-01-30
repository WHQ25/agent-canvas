import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { AddPolygonParams, AddPolygonResponse } from '../lib/protocol.js';

export interface AddPolygonOptions {
  points: string; // JSON string
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  fillStyle?: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag';
  note?: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface PolygonClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface AddPolygonDeps {
  connectToCanvas: () => Promise<PolygonClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: AddPolygonDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function addPolygon(options: AddPolygonOptions, deps: AddPolygonDeps = defaultDeps): Promise<void> {
  // Parse and validate points JSON
  let points: Array<{ x: number; y: number }>;
  try {
    points = JSON.parse(options.points);
  } catch {
    deps.error('Invalid points JSON');
    deps.exit(1);
    return;
  }

  const client = await deps.connectToCanvas();

  // Build params
  const params: AddPolygonParams = {
    points,
    strokeColor: options.strokeColor,
    backgroundColor: options.backgroundColor,
    strokeWidth: options.strokeWidth,
    strokeStyle: options.strokeStyle,
    fillStyle: options.fillStyle,
    customData: options.note ? { note: options.note } : undefined,
  };

  const result = await client.send<AddPolygonResponse>({
    type: 'addPolygon',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log(`Polygon created (id: ${result.elementId})`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
