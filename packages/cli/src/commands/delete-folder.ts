import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { DeleteFolderResponse } from '../lib/protocol.js';

export interface DeleteFolderOptions {
  name: string;
}

export interface DeleteFolderClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface DeleteFolderDeps {
  connectToCanvas: () => Promise<DeleteFolderClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: DeleteFolderDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function deleteFolder(options: DeleteFolderOptions, deps: DeleteFolderDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const result = await client.send<DeleteFolderResponse>({
    type: 'deleteFolder',
    id: deps.generateId(),
    params: { name: options.name },
  });

  if (result.success) {
    deps.log(`Folder "${options.name}" deleted`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
