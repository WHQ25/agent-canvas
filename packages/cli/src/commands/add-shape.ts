import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { AddShapeParams, AddShapeResponse } from '../lib/protocol.js';

export interface AddShapeOptions {
  type: 'rectangle' | 'ellipse' | 'diamond';
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  fillStyle?: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag';
  label?: string;
  labelFontSize?: number;
  note?: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface ShapeClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface AddShapeDeps {
  connectToCanvas: () => Promise<ShapeClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: AddShapeDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function addShape(options: AddShapeOptions, deps: AddShapeDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Build params
  const params: AddShapeParams = {
    type: options.type,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    strokeColor: options.strokeColor,
    backgroundColor: options.backgroundColor,
    strokeWidth: options.strokeWidth,
    strokeStyle: options.strokeStyle,
    fillStyle: options.fillStyle,
    customData: options.note ? { note: options.note } : undefined,
  };

  if (options.label) {
    params.label = { text: options.label, fontSize: options.labelFontSize };
  }

  const result = await client.send<AddShapeResponse>({
    type: 'addShape',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log(`Shape created (id: ${result.elementId} x=${result.x} y=${result.y} w=${result.width} h=${result.height})`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
