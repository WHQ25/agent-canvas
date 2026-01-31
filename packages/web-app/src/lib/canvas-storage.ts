import { createStore, get, set, del, keys } from 'idb-keyval';
import type { CanvasMetadata, CanvasListState } from '../protocol';

const CANVAS_LIST_KEY = 'agent-canvas-list';
const DEFAULT_CANVAS_NAME = 'Default';

// IndexedDB stores (each createStore needs its own database)
const scenesStore = createStore('agent-canvas-scenes', 'scenes');
const filesStore = createStore('agent-canvas-files', 'files');

// Generate a short unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Get current timestamp
function now(): number {
  return Date.now();
}

export interface CanvasSceneData {
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: unknown;
}

export interface BinaryFileData {
  id: string;
  mimeType: string;
  dataURL: string;
  created: number;
}

// Load canvas list state (sync - uses localStorage for small metadata)
export function loadCanvasList(): CanvasListState {
  try {
    const saved = localStorage.getItem(CANVAS_LIST_KEY);
    if (saved) {
      return JSON.parse(saved) as CanvasListState;
    }
  } catch (error) {
    console.error('Failed to load canvas list:', error);
  }

  // Create default canvas
  const defaultCanvas = createDefaultCanvas();
  const state: CanvasListState = {
    activeCanvasId: defaultCanvas.id,
    canvases: [defaultCanvas],
  };
  saveCanvasList(state);
  return state;
}

// Save canvas list state (sync - uses localStorage for small metadata)
export function saveCanvasList(state: CanvasListState): void {
  try {
    localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save canvas list:', error);
  }
}

// Load scene data for a specific canvas (async - uses IndexedDB)
export async function loadCanvasScene(canvasId: string): Promise<CanvasSceneData | null> {
  try {
    const scene = await get<CanvasSceneData>(canvasId, scenesStore);
    return scene || null;
  } catch (error) {
    console.error(`Failed to load canvas scene ${canvasId}:`, error);
  }
  return null;
}

// Save scene data for a specific canvas (async - uses IndexedDB)
export async function saveCanvasScene(canvasId: string, data: CanvasSceneData): Promise<void> {
  try {
    // Extract files from scene data and save separately
    const files = data.files as Record<string, BinaryFileData> | undefined;
    const sceneWithoutFiles: CanvasSceneData = {
      elements: data.elements,
      appState: data.appState,
    };

    await set(canvasId, sceneWithoutFiles, scenesStore);

    // Save files separately
    if (files) {
      await saveFiles(canvasId, files);
    }
  } catch (error) {
    console.error(`Failed to save canvas scene ${canvasId}:`, error);
  }
}

// Delete scene data for a specific canvas (async - uses IndexedDB)
export async function deleteCanvasScene(canvasId: string): Promise<void> {
  try {
    await del(canvasId, scenesStore);
    await deleteFilesForCanvas(canvasId);
  } catch (error) {
    console.error(`Failed to delete canvas scene ${canvasId}:`, error);
  }
}

// Save files associated with a canvas
export async function saveFiles(canvasId: string, files: Record<string, BinaryFileData>): Promise<void> {
  try {
    const newFileIds = Object.keys(files);

    if (newFileIds.length === 0) {
      await del(`files-${canvasId}`, filesStore);
      return;
    }

    // Save each file
    for (const [fileId, fileData] of Object.entries(files)) {
      await set(fileId, fileData, filesStore);
    }

    // Update file mapping for this canvas
    await set(`files-${canvasId}`, newFileIds, filesStore);
  } catch (error) {
    console.error('Failed to save files:', error);
  }
}

// Load files for a canvas
export async function loadFilesForCanvas(canvasId: string): Promise<Record<string, BinaryFileData>> {
  try {
    const fileIds = await get<string[]>(`files-${canvasId}`, filesStore) || [];
    const files: Record<string, BinaryFileData> = {};

    for (const fileId of fileIds) {
      const fileData = await get<BinaryFileData>(fileId, filesStore);
      if (fileData) {
        files[fileId] = fileData;
      }
    }

    return files;
  } catch (error) {
    console.error('Failed to load files:', error);
    return {};
  }
}

// Delete files for a canvas (only deletes unreferenced files)
async function deleteFilesForCanvas(canvasId: string): Promise<void> {
  try {
    const fileIds = await get<string[]>(`files-${canvasId}`, filesStore) || [];
    if (fileIds.length === 0) {
      await del(`files-${canvasId}`, filesStore);
      return;
    }

    // Get all file mapping keys from other canvases
    const allKeys = await keys(filesStore);
    const otherMappingKeys = (allKeys as string[]).filter(
      key => key.startsWith('files-') && key !== `files-${canvasId}`
    );

    // Collect all fileIds referenced by other canvases
    const referencedFileIds = new Set<string>();
    for (const mappingKey of otherMappingKeys) {
      const otherFileIds = await get<string[]>(mappingKey, filesStore) || [];
      for (const fid of otherFileIds) {
        referencedFileIds.add(fid);
      }
    }

    // Delete only unreferenced files
    for (const fileId of fileIds) {
      if (!referencedFileIds.has(fileId)) {
        await del(fileId, filesStore);
      }
    }

    // Delete file mapping
    await del(`files-${canvasId}`, filesStore);
  } catch (error) {
    console.error('Failed to delete files:', error);
  }
}

// Create a default canvas metadata
function createDefaultCanvas(): CanvasMetadata {
  const timestamp = now();
  return {
    id: generateId(),
    name: DEFAULT_CANVAS_NAME,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// Create a new canvas
export function createCanvas(name: string): CanvasMetadata {
  const timestamp = now();
  return {
    id: generateId(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// Update canvas metadata (e.g., updatedAt)
export function updateCanvasTimestamp(state: CanvasListState, canvasId: string): CanvasListState {
  return {
    ...state,
    canvases: state.canvases.map(c =>
      c.id === canvasId ? { ...c, updatedAt: now() } : c
    ),
  };
}

// Find canvas by name (case-insensitive)
export function findCanvasByName(state: CanvasListState, name: string): CanvasMetadata | undefined {
  const lowerName = name.toLowerCase();
  return state.canvases.find(c => c.name.toLowerCase() === lowerName);
}

// Check if canvas name is unique
export function isCanvasNameUnique(state: CanvasListState, name: string, excludeId?: string): boolean {
  const lowerName = name.toLowerCase();
  return !state.canvases.some(c => c.name.toLowerCase() === lowerName && c.id !== excludeId);
}

// Load all scenes for initial cache (async)
export async function loadAllScenes(canvases: CanvasMetadata[]): Promise<Map<string, CanvasSceneData | null>> {
  const cache = new Map<string, CanvasSceneData | null>();

  for (const canvas of canvases) {
    let scene = await loadCanvasScene(canvas.id);

    // Load files separately and merge back
    if (scene) {
      const files = await loadFilesForCanvas(canvas.id);
      if (Object.keys(files).length > 0) {
        scene = { ...scene, files };
      }
    }

    cache.set(canvas.id, scene);
  }

  return cache;
}

// ============================================================================
// Canvas Management Pure Functions (for CLI handlers)
// ============================================================================

export interface CreateCanvasValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate canvas creation parameters
 */
export function validateCreateCanvas(state: CanvasListState, name: string): CreateCanvasValidation {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { valid: false, error: 'Canvas name cannot be empty' };
  }
  if (!isCanvasNameUnique(state, trimmedName)) {
    return { valid: false, error: `Canvas "${trimmedName}" already exists` };
  }
  return { valid: true };
}

/**
 * Create new state with added canvas (does not change activeCanvasId)
 */
export function addCanvasToState(state: CanvasListState, newCanvas: CanvasMetadata): CanvasListState {
  return {
    activeCanvasId: state.activeCanvasId,
    canvases: [...state.canvases, newCanvas],
  };
}

export interface SwitchCanvasValidation {
  valid: boolean;
  canvas?: CanvasMetadata;
  error?: string;
  alreadyActive?: boolean;
}

/**
 * Validate canvas switch parameters
 */
export function validateSwitchCanvas(
  state: CanvasListState,
  name: string,
  currentAgentCanvasId: string
): SwitchCanvasValidation {
  const canvas = findCanvasByName(state, name);
  if (!canvas) {
    return { valid: false, error: `Canvas "${name}" not found` };
  }
  if (canvas.id === currentAgentCanvasId) {
    return { valid: true, canvas, alreadyActive: true };
  }
  return { valid: true, canvas };
}

export interface RenameCanvasValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate canvas rename parameters
 */
export function validateRenameCanvas(
  state: CanvasListState,
  newName: string,
  canvasId: string
): RenameCanvasValidation {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    return { valid: false, error: 'Canvas name cannot be empty' };
  }
  if (!isCanvasNameUnique(state, trimmedName, canvasId)) {
    return { valid: false, error: `Canvas "${trimmedName}" already exists` };
  }
  return { valid: true };
}

/**
 * Rename a canvas in state (returns new state)
 */
export function renameCanvasInState(
  state: CanvasListState,
  canvasId: string,
  newName: string
): { state: CanvasListState; canvas: CanvasMetadata | undefined } {
  const trimmedName = newName.trim();
  const updatedCanvases = state.canvases.map(c =>
    c.id === canvasId
      ? { ...c, name: trimmedName, updatedAt: Date.now() }
      : c
  );
  const renamedCanvas = updatedCanvases.find(c => c.id === canvasId);
  return {
    state: { ...state, canvases: updatedCanvases },
    canvas: renamedCanvas,
  };
}

/**
 * Generate a unique canvas name based on base name
 */
export function generateUniqueCanvasName(state: CanvasListState, baseName: string, excludeId?: string): string {
  let counter = 1;
  let name = baseName;
  while (!isCanvasNameUnique(state, name, excludeId)) {
    name = `${baseName} ${counter++}`;
  }
  return name;
}
