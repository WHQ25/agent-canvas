import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { CreateFolderResponse } from '../lib/protocol.js';

export interface CreateFolderOptions {
  name: string;
}

export interface CreateFolderClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface CreateFolderDeps {
  connectToCanvas: () => Promise<CreateFolderClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: CreateFolderDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function createFolder(options: CreateFolderOptions, deps: CreateFolderDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const result = await client.send<CreateFolderResponse>({
    type: 'createFolder',
    id: deps.generateId(),
    params: { name: options.name },
  });

  if (result.success && result.category) {
    deps.log(`Folder "${result.category.name}" created`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
