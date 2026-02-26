import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { MoveCanvasToFolderResponse } from '../lib/protocol.js';

export interface MoveToFolderOptions {
  canvasName: string;
  folderName: string | null;
}

export interface MoveToFolderClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface MoveToFolderDeps {
  connectToCanvas: () => Promise<MoveToFolderClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: MoveToFolderDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function moveToFolder(options: MoveToFolderOptions, deps: MoveToFolderDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const result = await client.send<MoveCanvasToFolderResponse>({
    type: 'moveCanvasToFolder',
    id: deps.generateId(),
    params: { canvasName: options.canvasName, folderName: options.folderName },
  });

  if (result.success) {
    if (options.folderName) {
      deps.log(`Canvas "${options.canvasName}" moved to folder "${options.folderName}"`);
    } else {
      deps.log(`Canvas "${options.canvasName}" moved to ungrouped`);
    }
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
