import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { LoadSceneResponse } from '../lib/protocol.js';

// Minimal client interface for dependency injection
export interface LoadClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface LoadDeps {
  connectToCanvas: () => Promise<LoadClient>;
  generateId: () => string;
  readFile: (path: string, encoding: 'utf-8') => string;
  existsSync: (path: string) => boolean;
  resolvePath: (path: string) => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: LoadDeps = {
  connectToCanvas,
  generateId,
  readFile: readFileSync,
  existsSync,
  resolvePath: resolve,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function load(filepath: string | undefined, deps: LoadDeps = defaultDeps): Promise<void> {
  // Validate filepath is provided
  if (!filepath) {
    deps.error('Usage: agent-canvas load <filepath>');
    deps.exit(1);
    return;
  }

  // Resolve to absolute path
  const absolutePath = deps.resolvePath(filepath);

  // Check file exists
  if (!deps.existsSync(absolutePath)) {
    deps.error(`File not found: ${absolutePath}`);
    deps.exit(1);
    return;
  }

  // Read and parse file
  let content: string;
  let data: { elements?: unknown[]; appState?: unknown; files?: unknown };

  try {
    content = deps.readFile(absolutePath, 'utf-8');
  } catch (err) {
    deps.error(`Failed to read file: ${err instanceof Error ? err.message : err}`);
    deps.exit(1);
    return;
  }

  try {
    data = JSON.parse(content);
  } catch (err) {
    deps.error(`Failed to parse file: ${err instanceof Error ? err.message : err}`);
    deps.exit(1);
    return;
  }

  // Connect and send loadScene message
  const client = await deps.connectToCanvas();

  const result = await client.send<LoadSceneResponse>({
    type: 'loadScene',
    id: deps.generateId(),
    params: {
      elements: data.elements || [],
      appState: data.appState,
      files: data.files,
    },
  });

  if (result.success) {
    deps.log(`Loaded ${result.elementCount} elements from ${filepath}`);
  } else {
    deps.error(`Failed to load file: ${result.error}`);
    deps.exit(1);
  }

  client.close();
}
