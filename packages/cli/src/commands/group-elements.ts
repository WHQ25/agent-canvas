import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { GroupElementsParams, GroupElementsResponse } from '../lib/protocol.js';

export interface GroupElementsOptions {
  elementIds: string[];
}

// Minimal client interface for dependency injection (only methods we need)
export interface GroupClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface GroupElementsDeps {
  connectToCanvas: () => Promise<GroupClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: GroupElementsDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function groupElements(options: GroupElementsOptions, deps: GroupElementsDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  // Build params
  const params: GroupElementsParams = {
    elementIds: options.elementIds,
  };

  const result = await client.send<GroupElementsResponse>({
    type: 'groupElements',
    id: deps.generateId(),
    params,
  });

  if (result.success) {
    deps.log(`Group created (id: ${result.groupId})`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
