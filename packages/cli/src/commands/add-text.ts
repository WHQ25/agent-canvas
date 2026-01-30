import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { AddTextParams, AddTextResponse, TextAnchor } from '../lib/protocol.js';

export interface AddTextOptions {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  anchor?: TextAnchor;
  strokeColor?: string;
  note?: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface TextClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface AddTextDeps {
  connectToCanvas: () => Promise<TextClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: AddTextDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function addText(options: AddTextOptions, deps: AddTextDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Build params
  const params: AddTextParams = {
    text: options.text,
    x: options.x,
    y: options.y,
    fontSize: options.fontSize,
    textAlign: options.textAlign,
    anchor: options.anchor,
    strokeColor: options.strokeColor,
    customData: options.note ? { note: options.note } : undefined,
  };

  const result = await client.send<AddTextResponse>({
    type: 'addText',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log(`Text created (id: ${result.elementId}, x: ${result.x}, y: ${result.y}, ${result.width}x${result.height})`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
