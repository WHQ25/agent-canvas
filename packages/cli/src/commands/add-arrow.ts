import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { AddArrowParams, AddArrowResponse } from '../lib/protocol.js';

export interface AddArrowOptions {
  x: number;
  y: number;
  endX: number;
  endY: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  startArrowhead?: 'arrow' | 'bar' | 'dot' | 'triangle' | 'diamond' | 'none';
  endArrowhead?: 'arrow' | 'bar' | 'dot' | 'triangle' | 'diamond' | 'none';
  arrowType?: 'sharp' | 'round' | 'elbow';
  via?: string;
  note?: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface ArrowClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface AddArrowDeps {
  connectToCanvas: () => Promise<ArrowClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: AddArrowDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

/**
 * Parse via points string into midpoints array
 * @param via - Points string in format "x1,y1;x2,y2;..."
 * @returns Array of point objects
 */
export function parseViaPoints(via: string): Array<{ x: number; y: number }> {
  return via.split(';').map((pt: string) => {
    const [x, y] = pt.split(',').map(Number);
    return { x, y };
  });
}

export async function addArrow(options: AddArrowOptions, deps: AddArrowDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Parse --via option into midpoints array
  const midpoints = options.via ? parseViaPoints(options.via) : undefined;

  // Build params
  const params: AddArrowParams = {
    x: options.x,
    y: options.y,
    endX: options.endX,
    endY: options.endY,
    strokeColor: options.strokeColor,
    strokeWidth: options.strokeWidth,
    strokeStyle: options.strokeStyle,
    startArrowhead: options.startArrowhead,
    endArrowhead: options.endArrowhead,
    arrowType: options.arrowType,
    midpoints,
    customData: options.note ? { note: options.note } : undefined,
  };

  const result = await client.send<AddArrowResponse>({
    type: 'addArrow',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log(`Arrow created (id: ${result.elementId})`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
