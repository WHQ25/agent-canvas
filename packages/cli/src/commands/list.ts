import { connectToCanvas, generateId } from '../lib/ws-client.js';
import type { ListCanvasesResponse, CanvasMetadata, CanvasCategory } from '../lib/protocol.js';

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
  categories?: CanvasCategory[];
  canvasCategoryMap?: Record<string, string>;
}

function getMarker(canvas: CanvasMetadata, activeCanvasId?: string, agentActiveCanvasId?: string): string {
  const isUser = canvas.id === activeCanvasId;
  const isAgent = canvas.id === agentActiveCanvasId;
  if (isUser && isAgent) return '[UA]';
  if (isUser) return '[U] ';
  if (isAgent) return '[A] ';
  return '    ';
}

function formatCanvasLine(canvas: CanvasMetadata, activeCanvasId?: string, agentActiveCanvasId?: string, indent = ''): string {
  const marker = getMarker(canvas, activeCanvasId, agentActiveCanvasId);
  const date = new Date(canvas.updatedAt).toLocaleString();
  return `${indent}${marker} ${canvas.name} (updated: ${date})`;
}

export function formatCanvasList(result: ListResult): string[] {
  const lines: string[] = ['Canvases: ([U]=User [A]=Agent)'];
  const categories = result.categories || [];
  const categoryMap = result.canvasCategoryMap || {};

  if (categories.length === 0) {
    for (const canvas of result.canvases) {
      lines.push(formatCanvasLine(canvas, result.activeCanvasId, result.agentActiveCanvasId));
    }
    return lines;
  }

  const categorizedCanvasIds = new Set(Object.keys(categoryMap));
  const sorted = [...categories].sort((a, b) => a.order - b.order);

  for (const cat of sorted) {
    const catCanvases = result.canvases.filter(c => categoryMap[c.id] === cat.id);
    lines.push(`  [F] ${cat.name} (${catCanvases.length})`);
    for (const canvas of catCanvases) {
      lines.push(formatCanvasLine(canvas, result.activeCanvasId, result.agentActiveCanvasId, '    '));
    }
  }

  const ungrouped = result.canvases.filter(c => !categorizedCanvasIds.has(c.id));
  if (ungrouped.length > 0) {
    lines.push(`  Ungrouped (${ungrouped.length})`);
    for (const canvas of ungrouped) {
      lines.push(formatCanvasLine(canvas, result.activeCanvasId, result.agentActiveCanvasId, '    '));
    }
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
      categories: result.categories,
      canvasCategoryMap: result.canvasCategoryMap,
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
