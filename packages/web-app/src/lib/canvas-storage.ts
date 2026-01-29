import type { CanvasMetadata, CanvasListState } from '../protocol';

const CANVAS_LIST_KEY = 'agent-canvas-list';
const CANVAS_SCENE_PREFIX = 'agent-canvas-scene-';
const LEGACY_SCENE_KEY = 'agent-canvas-scene';
const DEFAULT_CANVAS_NAME = 'Default';

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

// Load canvas list state
export function loadCanvasList(): CanvasListState {
  try {
    const saved = localStorage.getItem(CANVAS_LIST_KEY);
    if (saved) {
      return JSON.parse(saved) as CanvasListState;
    }
  } catch (error) {
    console.error('Failed to load canvas list:', error);
  }

  // Check for legacy data and migrate
  const legacyData = localStorage.getItem(LEGACY_SCENE_KEY);
  if (legacyData) {
    return migrateFromLegacy();
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

// Save canvas list state
export function saveCanvasList(state: CanvasListState): void {
  try {
    localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save canvas list:', error);
  }
}

// Load scene data for a specific canvas
export function loadCanvasScene(canvasId: string): CanvasSceneData | null {
  try {
    const key = `${CANVAS_SCENE_PREFIX}${canvasId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as CanvasSceneData;
    }
  } catch (error) {
    console.error(`Failed to load canvas scene ${canvasId}:`, error);
  }
  return null;
}

// Save scene data for a specific canvas
export function saveCanvasScene(canvasId: string, data: CanvasSceneData): void {
  try {
    const key = `${CANVAS_SCENE_PREFIX}${canvasId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save canvas scene ${canvasId}:`, error);
  }
}

// Delete scene data for a specific canvas
export function deleteCanvasScene(canvasId: string): void {
  try {
    const key = `${CANVAS_SCENE_PREFIX}${canvasId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to delete canvas scene ${canvasId}:`, error);
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

// Migrate from legacy storage format
export function migrateFromLegacy(): CanvasListState {
  const defaultCanvas = createDefaultCanvas();

  // Try to migrate existing scene data
  try {
    const legacyData = localStorage.getItem(LEGACY_SCENE_KEY);
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      const sceneData: CanvasSceneData = {
        elements: parsed.elements || [],
        appState: parsed.appState || {},
      };
      saveCanvasScene(defaultCanvas.id, sceneData);

      // Remove legacy key after successful migration
      localStorage.removeItem(LEGACY_SCENE_KEY);
      console.log('Migrated legacy canvas data to new format');
    }
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }

  const state: CanvasListState = {
    activeCanvasId: defaultCanvas.id,
    canvases: [defaultCanvas],
  };
  saveCanvasList(state);
  return state;
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
