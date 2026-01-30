import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { ListCanvasesResponse, CanvasMetadata } from '../lib/protocol.js';

// Minimal client interface for dependency injection (only methods we need)
export interface ListClient {
  send: <T>(request: { type: string; id: string }) => Promise<T>;
  close: () => void;
}

export interface ListDeps {
  connectToCanvas: () => Promise<ListClient>;
  generateId: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: ListDeps = {
  connectToCanvas,
  generateId,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export interface ListResult {
  activeCanvasId?: string;
  agentActiveCanvasId?: string;
  canvases: CanvasMetadata[];
}

export function formatCanvasList(result: ListResult): string[] {
  const lines: string[] = ['Canvases: ([U]=User [A]=Agent)'];
  for (const canvas of result.canvases) {
    const isUser = canvas.id === result.activeCanvasId;
    const isAgent = canvas.id === result.agentActiveCanvasId;
    let marker = '    ';
    if (isUser && isAgent) {
      marker = '[UA]';
    } else if (isUser) {
      marker = '[U] ';
    } else if (isAgent) {
      marker = '[A] ';
    }
    const date = new Date(canvas.updatedAt).toLocaleString();
    lines.push(`${marker} ${canvas.name} (updated: ${date})`);
  }
  return lines;
}

export async function list(deps: ListDeps = defaultDeps): Promise<void> {
  const client = await deps.connectToCanvas();

  const result = await client.send<ListCanvasesResponse>({
    type: 'listCanvases',
    id: deps.generateId(),
  });

  if (result.success && result.canvases) {
    const lines = formatCanvasList({
      activeCanvasId: result.activeCanvasId,
      agentActiveCanvasId: result.agentActiveCanvasId,
      canvases: result.canvases,
    });
    for (const line of lines) {
      deps.log(line);
    }
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
