/**
 * Type definitions for message handler dependencies.
 * These interfaces enable dependency injection for testing.
 */

import type { CanvasSceneData } from './canvas-storage';

// Re-export for convenience
export type { CanvasSceneData };

/**
 * Bound element reference (arrows or text bound to shapes)
 */
export interface BoundElementRef {
  id: string;
  type: 'arrow' | 'text';
}

/**
 * Excalidraw element with common properties
 */
export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  groupIds?: string[];
  angle?: number;
  isDeleted?: boolean;
  strokeColor?: string;
  backgroundColor?: string;
  text?: string;
  fontSize?: number;
  containerId?: string | null;
  boundElements?: readonly BoundElementRef[] | null;
  points?: number[][];
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  fileId?: string | null;
  customData?: Record<string, unknown>;
}

/**
 * Binary file data for images
 */
export interface BinaryFileData {
  mimeType: string;
  id: string;
  dataURL: string;
  created: number;
}

/**
 * Excalidraw API interface (subset used by handlers)
 */
export interface ExcalidrawAPI {
  getSceneElements: () => readonly ExcalidrawElement[];
  getSceneElementsIncludingDeleted: () => readonly ExcalidrawElement[];
  getAppState: () => unknown;
  getFiles: () => unknown;
  updateScene: (scene: {
    elements?: readonly unknown[];
    appState?: unknown;
    captureUpdate?: 'IMMEDIATELY' | 'EVENTUALLY' | 'NEVER';
  }) => void;
  addFiles: (files: BinaryFileData[]) => void;
}

/**
 * Storage operations interface
 */
export interface StorageDeps {
  loadCanvasScene: (canvasId: string) => Promise<CanvasSceneData | null>;
  saveCanvasScene: (canvasId: string, data: CanvasSceneData) => Promise<void>;
}

/**
 * Context for handler execution
 */
export interface HandlerContext {
  api: ExcalidrawAPI;
  canvasId: string;
  useDirectStorage: boolean;
}

/**
 * Dependencies for message handlers
 */
export interface HandlerDeps {
  /**
   * Get the handler context (API, canvas ID, storage mode).
   * Returns null if canvas is not available.
   */
  getContext: () => HandlerContext | null;

  /**
   * Storage operations
   */
  storage: StorageDeps;

  /**
   * Save elements to storage and sync to user's view if they're on the same canvas.
   * This is used for agent commands that modify elements on potentially different canvases.
   */
  saveAndSync: (canvasId: string, elements: unknown[], files?: unknown) => Promise<void>;

  /**
   * Capture update action constant from Excalidraw
   */
  CaptureUpdateAction: {
    IMMEDIATELY: 'IMMEDIATELY';
  };
}

/**
 * Result type for handlers that return element info
 */
export interface ElementResult {
  success: true;
  elementId: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Error result type
 */
export interface ErrorResult {
  success: false;
  error: string;
}

/**
 * Generic handler result
 */
export type HandlerResult<T extends object = object> = (T & { success: true }) | ErrorResult;
