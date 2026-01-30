import { readFileSync } from 'node:fs';
import { connectToCanvas, generateId } from '../lib/ws-client.js';
import { getMimeType, generateFileId, MAX_IMAGE_SIZE } from '../lib/image-utils.js';
import type { AddImageResponse } from '../lib/protocol.js';

export interface AddImageOptions {
  file: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  note?: string;
}

// Minimal client interface for dependency injection (only methods we need)
export interface ImageClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface AddImageDeps {
  readFile: (path: string) => Buffer;
  connectToCanvas: () => Promise<ImageClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: AddImageDeps = {
  readFile: readFileSync,
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function addImage(options: AddImageOptions, deps: AddImageDeps = defaultDeps): Promise<void> {
  // 1. Validate file extension
  const mimeType = getMimeType(options.file);
  if (!mimeType) {
    deps.error('Unsupported image format. Supported: PNG, JPEG, GIF, SVG, WebP');
    deps.exit(1);
    return;
  }

  // 2. Read file
  let buffer: Buffer;
  try {
    buffer = deps.readFile(options.file);
  } catch {
    deps.error(`Failed to read file: ${options.file}`);
    deps.exit(1);
    return;
  }

  // 3. Check file size
  if (buffer.length > MAX_IMAGE_SIZE) {
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
    deps.error(`Image too large: ${sizeMB}MB (max: 2MB)`);
    deps.exit(1);
    return;
  }

  // 4. Convert to base64 and generate fileId
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const fileId = generateFileId(buffer);

  // 5. Send WebSocket message
  const client = await deps.connectToCanvas();
  const result = await client.send<AddImageResponse>({
    type: 'addImage',
    id: deps.generateId(),
    params: {
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      dataUrl,
      mimeType,
      fileId,
      customData: options.note ? { note: options.note } : undefined,
    },
  });

  // 6. Handle response
  if (result.success) {
    deps.log(`Image added (id: ${result.elementId}, fileId: ${result.fileId} x=${result.x} y=${result.y} w=${result.width} h=${result.height})`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
