import { encode as toToon } from '@toon-format/toon';
import { connectToCanvas, generateId } from '../lib/ws-client.js';
import { convertElementsToToon } from '../lib/toon-converter.js';
import type { ReadSceneResponse, SaveSceneResponse } from '../lib/protocol.js';

// Minimal client interface for dependency injection
export interface ReadClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface ReadDeps {
  connectToCanvas: () => Promise<ReadClient>;
  generateId: () => string;
  toToon: typeof toToon;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: ReadDeps = {
  connectToCanvas,
  generateId,
  toToon,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export interface ReadOptions {
  json?: boolean;
  withStyle?: boolean;
}

export async function read(options: ReadOptions, deps: ReadDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  if (options.json) {
    // Return raw Excalidraw scene data
    const result = await client.send<SaveSceneResponse>({
      type: 'saveScene',
      id: deps.generateId(),
    });
    if (result.success && result.data) {
      deps.log(JSON.stringify(result.data, null, 2));
    } else {
      deps.error(`Failed: ${result.error}`);
      deps.exit(1);
    }
    client.close();
    return;
  }

  // Default: TOON format
  const result = await client.send<ReadSceneResponse>({
    type: 'readScene',
    id: deps.generateId(),
  });

  if (result.success && result.elements) {
    const toonData = convertElementsToToon(result.elements, options.withStyle ?? false);
    deps.log(deps.toToon(toonData));

    // Output selected elements
    const selectedIds = result.selectedElementIds ?? [];
    if (selectedIds.length > 0) {
      deps.log(`\nSelected: ${selectedIds.join(', ')}`);
    }
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
