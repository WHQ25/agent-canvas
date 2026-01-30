import { connectToCanvas, generateId } from '../lib/ws-client.js';
import { writeFileSync } from 'node:fs';
import type { ExportImageResponse } from '../lib/protocol.js';

export interface ExportOptions {
  output?: string;
  background?: boolean;
  dark?: boolean;
  embedScene?: boolean;
  scale?: number;
}

// Minimal client interface for dependency injection
export interface ExportClient {
  send: <T>(request: { type: string; id: string; params?: unknown }) => Promise<T>;
  close: () => void;
}

export interface ExportDeps {
  connectToCanvas: () => Promise<ExportClient>;
  generateId: () => string;
  writeFile: (path: string, data: Buffer) => void;
  now: () => number;
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => never | void;
}

export const defaultDeps: ExportDeps = {
  connectToCanvas,
  generateId,
  writeFile: writeFileSync,
  now: Date.now,
  log: console.log,
  error: console.error,
  exit: process.exit,
};

export async function exportImage(options: ExportOptions, deps: ExportDeps = defaultDeps): Promise<void> {
  // Validate scale
  const scale = options.scale ?? 1;
  if (![1, 2, 3].includes(scale)) {
    deps.error('Scale must be 1, 2, or 3');
    deps.exit(1);
    return;
  }

  const client = await deps.connectToCanvas();

  const result = await client.send<ExportImageResponse>({
    type: 'exportImage',
    id: deps.generateId(),
    params: {
      background: options.background ?? true,
      dark: options.dark ?? false,
      embedScene: options.embedScene ?? false,
      scale: scale as 1 | 2 | 3,
    },
  });

  if (result.success && result.dataUrl) {
    // Extract base64 data from data URL
    const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate output path if not specified
    const outputPath = options.output ?? `canvas-${deps.now()}.png`;
    deps.writeFile(outputPath, buffer);
    deps.log(`Exported to ${outputPath}`);
  } else {
    deps.error(`Failed: ${result.error}`);
    deps.exit(1);
  }
  client.close();
}
