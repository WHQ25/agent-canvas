import { connectToCanvas, generateId } from '../lib/ws-client.js';
import { writeFileSync } from 'node:fs';
import type { SaveSceneResponse } from '../lib/protocol.js';

// Minimal client interface for dependency injection
export interface SaveClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface SaveDeps {
  connectToCanvas: () => Promise<SaveClient>;
  generateId: () => string;
  writeFile: (path: string, data: string) => void;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: SaveDeps = {
  connectToCanvas,
  generateId,
  writeFile: writeFileSync,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function save(filepath: string, deps: SaveDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const result = await client.send<SaveSceneResponse>({
    type: 'saveScene',
    id: deps.generateId(),
  });

  if (result.success && result.data) {
    const outputPath = filepath.endsWith('.excalidraw') ? filepath : `${filepath}.excalidraw`;
    deps.writeFile(outputPath, JSON.stringify(result.data, null, 2));
    deps.log(`Saved to ${outputPath}`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
