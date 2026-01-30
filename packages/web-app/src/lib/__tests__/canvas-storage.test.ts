import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateId,
  createCanvas,
  findCanvasByName,
  isCanvasNameUnique,
  updateCanvasTimestamp,
  loadCanvasList,
  saveCanvasList,
  loadCanvasScene,
  saveCanvasScene,
  deleteCanvasScene,
  saveFiles,
  loadFilesForCanvas,
  loadAllScenes,
  validateCreateCanvas,
  addCanvasToState,
  validateSwitchCanvas,
  validateRenameCanvas,
  renameCanvasInState,
  generateUniqueCanvasName,
  type CanvasSceneData,
  type BinaryFileData,
} from '../canvas-storage';
import type { CanvasListState } from '../../protocol';

describe('generateId', () => {
  it('should return an 8-character string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(8);
  });

  it('should return unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('should only contain alphanumeric characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe('createCanvas', () => {
  it('should return a canvas with the correct structure', () => {
    const name = 'Test Canvas';
    const canvas = createCanvas(name);

    expect(canvas).toHaveProperty('id');
    expect(canvas).toHaveProperty('name', name);
    expect(canvas).toHaveProperty('createdAt');
    expect(canvas).toHaveProperty('updatedAt');
  });

  it('should set createdAt and updatedAt to the same value', () => {
    const canvas = createCanvas('Test');
    expect(canvas.createdAt).toBe(canvas.updatedAt);
  });

  it('should generate a unique id', () => {
    const canvas1 = createCanvas('Canvas 1');
    const canvas2 = createCanvas('Canvas 2');
    expect(canvas1.id).not.toBe(canvas2.id);
  });

  it('should set timestamps close to current time', () => {
    const before = Date.now();
    const canvas = createCanvas('Test');
    const after = Date.now();

    expect(canvas.createdAt).toBeGreaterThanOrEqual(before);
    expect(canvas.createdAt).toBeLessThanOrEqual(after);
  });
});

describe('findCanvasByName', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'Second Canvas', createdAt: 2000, updatedAt: 2000 },
        { id: 'canvas3', name: 'Third Canvas', createdAt: 3000, updatedAt: 3000 },
      ],
    };
  });

  it('should find canvas by exact name match', () => {
    const canvas = findCanvasByName(state, 'Second Canvas');
    expect(canvas?.id).toBe('canvas2');
  });

  it('should find canvas case-insensitively', () => {
    const canvas = findCanvasByName(state, 'SECOND CANVAS');
    expect(canvas?.id).toBe('canvas2');

    const canvas2 = findCanvasByName(state, 'second canvas');
    expect(canvas2?.id).toBe('canvas2');
  });

  it('should return undefined for non-existent canvas', () => {
    const canvas = findCanvasByName(state, 'Non Existent');
    expect(canvas).toBeUndefined();
  });

  it('should return undefined for empty name', () => {
    const canvas = findCanvasByName(state, '');
    expect(canvas).toBeUndefined();
  });
});

describe('isCanvasNameUnique', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'Second Canvas', createdAt: 2000, updatedAt: 2000 },
      ],
    };
  });

  it('should return true for unique name', () => {
    expect(isCanvasNameUnique(state, 'New Canvas')).toBe(true);
  });

  it('should return false for existing name', () => {
    expect(isCanvasNameUnique(state, 'First Canvas')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isCanvasNameUnique(state, 'FIRST CANVAS')).toBe(false);
    expect(isCanvasNameUnique(state, 'first canvas')).toBe(false);
  });

  it('should exclude specified ID from check', () => {
    // When renaming canvas1, its own name should be considered unique
    expect(isCanvasNameUnique(state, 'First Canvas', 'canvas1')).toBe(true);
  });

  it('should still detect conflicts when excluding different ID', () => {
    // canvas2 trying to use canvas1's name should fail
    expect(isCanvasNameUnique(state, 'First Canvas', 'canvas2')).toBe(false);
  });
});

describe('updateCanvasTimestamp', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'Second Canvas', createdAt: 2000, updatedAt: 2000 },
      ],
    };
  });

  it('should update the timestamp of the specified canvas', () => {
    const before = Date.now();
    const newState = updateCanvasTimestamp(state, 'canvas1');
    const after = Date.now();

    const canvas = newState.canvases.find(c => c.id === 'canvas1');
    expect(canvas?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(canvas?.updatedAt).toBeLessThanOrEqual(after);
  });

  it('should not modify other canvases', () => {
    const newState = updateCanvasTimestamp(state, 'canvas1');
    const canvas2 = newState.canvases.find(c => c.id === 'canvas2');
    expect(canvas2?.updatedAt).toBe(2000);
  });

  it('should not modify createdAt', () => {
    const newState = updateCanvasTimestamp(state, 'canvas1');
    const canvas = newState.canvases.find(c => c.id === 'canvas1');
    expect(canvas?.createdAt).toBe(1000);
  });

  it('should return a new state object (immutability)', () => {
    const newState = updateCanvasTimestamp(state, 'canvas1');
    expect(newState).not.toBe(state);
    expect(newState.canvases).not.toBe(state.canvases);
  });

  it('should preserve activeCanvasId', () => {
    const newState = updateCanvasTimestamp(state, 'canvas2');
    expect(newState.activeCanvasId).toBe('canvas1');
  });
});

// ============================================================
// Async Functions Tests (IndexedDB and localStorage)
// ============================================================

describe('loadCanvasList / saveCanvasList (localStorage)', () => {
  const CANVAS_LIST_KEY = 'agent-canvas-list';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and return default canvas when no saved data exists', () => {
    const state = loadCanvasList();

    expect(state.canvases).toHaveLength(1);
    expect(state.canvases[0].name).toBe('Default');
    expect(state.activeCanvasId).toBe(state.canvases[0].id);
  });

  it('should save and load canvas list correctly', () => {
    const testState: CanvasListState = {
      activeCanvasId: 'test-id',
      canvases: [
        { id: 'test-id', name: 'Test Canvas', createdAt: 1000, updatedAt: 2000 },
        { id: 'test-id-2', name: 'Another Canvas', createdAt: 3000, updatedAt: 4000 },
      ],
    };

    saveCanvasList(testState);
    const loaded = loadCanvasList();

    expect(loaded).toEqual(testState);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem(CANVAS_LIST_KEY, 'invalid json {{{');

    const state = loadCanvasList();

    // Should return default canvas on error
    expect(state.canvases).toHaveLength(1);
    expect(state.canvases[0].name).toBe('Default');
  });

  it('should persist default canvas to localStorage after creation', () => {
    loadCanvasList();

    const saved = localStorage.getItem(CANVAS_LIST_KEY);
    expect(saved).not.toBeNull();

    const parsed = JSON.parse(saved!);
    expect(parsed.canvases).toHaveLength(1);
    expect(parsed.canvases[0].name).toBe('Default');
  });
});

describe('loadCanvasScene / saveCanvasScene (IndexedDB)', () => {
  beforeEach(async () => {
    // Clear IndexedDB stores before each test
    const { clear } = await import('idb-keyval');
    const { createStore } = await import('idb-keyval');
    const scenesStore = createStore('agent-canvas-scenes', 'scenes');
    const filesStore = createStore('agent-canvas-files', 'files');
    await clear(scenesStore);
    await clear(filesStore);
  });

  it('should return null for non-existent canvas', async () => {
    const scene = await loadCanvasScene('non-existent-id');
    expect(scene).toBeNull();
  });

  it('should save and load scene data correctly', async () => {
    const canvasId = 'test-canvas';
    const sceneData: CanvasSceneData = {
      elements: [
        { id: 'elem1', type: 'rectangle', x: 100, y: 100 },
        { id: 'elem2', type: 'ellipse', x: 200, y: 200 },
      ],
      appState: { zoom: 1, scrollX: 0, scrollY: 0 },
    };

    await saveCanvasScene(canvasId, sceneData);
    const loaded = await loadCanvasScene(canvasId);

    expect(loaded).not.toBeNull();
    expect(loaded!.elements).toEqual(sceneData.elements);
    expect(loaded!.appState).toEqual(sceneData.appState);
  });

  it('should handle empty elements array', async () => {
    const canvasId = 'empty-canvas';
    const sceneData: CanvasSceneData = {
      elements: [],
      appState: {},
    };

    await saveCanvasScene(canvasId, sceneData);
    const loaded = await loadCanvasScene(canvasId);

    expect(loaded).not.toBeNull();
    expect(loaded!.elements).toEqual([]);
  });

  it('should overwrite existing scene data', async () => {
    const canvasId = 'overwrite-test';
    const initialData: CanvasSceneData = {
      elements: [{ id: 'old', type: 'rectangle' }],
    };
    const newData: CanvasSceneData = {
      elements: [{ id: 'new', type: 'ellipse' }],
    };

    await saveCanvasScene(canvasId, initialData);
    await saveCanvasScene(canvasId, newData);
    const loaded = await loadCanvasScene(canvasId);

    expect(loaded!.elements).toEqual(newData.elements);
  });

  it('should save files separately when present in scene data', async () => {
    const canvasId = 'with-files';
    const fileData: BinaryFileData = {
      id: 'file-1',
      mimeType: 'image/png',
      dataURL: 'data:image/png;base64,abc123',
      created: 1000,
    };
    const sceneData: CanvasSceneData = {
      elements: [{ id: 'elem1', type: 'image' }],
      files: { 'file-1': fileData },
    };

    await saveCanvasScene(canvasId, sceneData);

    // Scene should be saved without files
    const loaded = await loadCanvasScene(canvasId);
    expect(loaded!.files).toBeUndefined();

    // Files should be saved separately
    const files = await loadFilesForCanvas(canvasId);
    expect(files['file-1']).toEqual(fileData);
  });
});

describe('deleteCanvasScene (IndexedDB)', () => {
  beforeEach(async () => {
    const { clear, createStore } = await import('idb-keyval');
    const scenesStore = createStore('agent-canvas-scenes', 'scenes');
    const filesStore = createStore('agent-canvas-files', 'files');
    await clear(scenesStore);
    await clear(filesStore);
  });

  it('should delete existing scene', async () => {
    const canvasId = 'to-delete';
    await saveCanvasScene(canvasId, { elements: [{ id: 'test' }] });

    await deleteCanvasScene(canvasId);
    const loaded = await loadCanvasScene(canvasId);

    expect(loaded).toBeNull();
  });

  it('should not throw when deleting non-existent scene', async () => {
    await expect(deleteCanvasScene('non-existent')).resolves.not.toThrow();
  });

  it('should also delete associated files', async () => {
    const canvasId = 'with-files-delete';
    const fileData: BinaryFileData = {
      id: 'file-to-delete',
      mimeType: 'image/png',
      dataURL: 'data:image/png;base64,xyz',
      created: 1000,
    };
    await saveCanvasScene(canvasId, {
      elements: [],
      files: { 'file-to-delete': fileData },
    });

    await deleteCanvasScene(canvasId);

    const files = await loadFilesForCanvas(canvasId);
    expect(Object.keys(files)).toHaveLength(0);
  });
});

describe('saveFiles / loadFilesForCanvas (IndexedDB)', () => {
  beforeEach(async () => {
    const { clear, createStore } = await import('idb-keyval');
    const filesStore = createStore('agent-canvas-files', 'files');
    await clear(filesStore);
  });

  it('should return empty object for canvas with no files', async () => {
    const files = await loadFilesForCanvas('no-files-canvas');
    expect(files).toEqual({});
  });

  it('should save and load files correctly', async () => {
    const canvasId = 'files-test';
    const files: Record<string, BinaryFileData> = {
      'file-1': {
        id: 'file-1',
        mimeType: 'image/png',
        dataURL: 'data:image/png;base64,abc',
        created: 1000,
      },
      'file-2': {
        id: 'file-2',
        mimeType: 'image/jpeg',
        dataURL: 'data:image/jpeg;base64,def',
        created: 2000,
      },
    };

    await saveFiles(canvasId, files);
    const loaded = await loadFilesForCanvas(canvasId);

    expect(loaded).toEqual(files);
  });

  it('should append new files to existing files', async () => {
    const canvasId = 'append-test';
    const files1: Record<string, BinaryFileData> = {
      'file-1': {
        id: 'file-1',
        mimeType: 'image/png',
        dataURL: 'data:image/png;base64,first',
        created: 1000,
      },
    };
    const files2: Record<string, BinaryFileData> = {
      'file-2': {
        id: 'file-2',
        mimeType: 'image/png',
        dataURL: 'data:image/png;base64,second',
        created: 2000,
      },
    };

    await saveFiles(canvasId, files1);
    await saveFiles(canvasId, files2);
    const loaded = await loadFilesForCanvas(canvasId);

    expect(Object.keys(loaded)).toHaveLength(2);
    expect(loaded['file-1']).toEqual(files1['file-1']);
    expect(loaded['file-2']).toEqual(files2['file-2']);
  });

  it('should handle empty files object', async () => {
    const canvasId = 'empty-files';
    await saveFiles(canvasId, {});
    const loaded = await loadFilesForCanvas(canvasId);

    // Empty files should not create mapping
    expect(loaded).toEqual({});
  });
});

describe('loadAllScenes (IndexedDB)', () => {
  beforeEach(async () => {
    const { clear, createStore } = await import('idb-keyval');
    const scenesStore = createStore('agent-canvas-scenes', 'scenes');
    const filesStore = createStore('agent-canvas-files', 'files');
    await clear(scenesStore);
    await clear(filesStore);
  });

  it('should return empty map for empty canvas list', async () => {
    const cache = await loadAllScenes([]);
    expect(cache.size).toBe(0);
  });

  it('should load all scenes for given canvases', async () => {
    // Setup test data
    await saveCanvasScene('canvas1', { elements: [{ id: 'elem1' }] });
    await saveCanvasScene('canvas2', { elements: [{ id: 'elem2' }] });

    const canvases = [
      { id: 'canvas1', name: 'Canvas 1', createdAt: 1000, updatedAt: 1000 },
      { id: 'canvas2', name: 'Canvas 2', createdAt: 2000, updatedAt: 2000 },
    ];

    const cache = await loadAllScenes(canvases);

    expect(cache.size).toBe(2);
    expect(cache.get('canvas1')?.elements).toEqual([{ id: 'elem1' }]);
    expect(cache.get('canvas2')?.elements).toEqual([{ id: 'elem2' }]);
  });

  it('should return null for canvases without saved scenes', async () => {
    const canvases = [
      { id: 'no-scene', name: 'No Scene', createdAt: 1000, updatedAt: 1000 },
    ];

    const cache = await loadAllScenes(canvases);

    expect(cache.size).toBe(1);
    expect(cache.get('no-scene')).toBeNull();
  });

  it('should merge files back into scene data', async () => {
    const canvasId = 'with-files';
    const fileData: BinaryFileData = {
      id: 'file-1',
      mimeType: 'image/png',
      dataURL: 'data:image/png;base64,test',
      created: 1000,
    };

    // Save scene with files (files are saved separately)
    await saveCanvasScene(canvasId, {
      elements: [{ id: 'img' }],
      files: { 'file-1': fileData },
    });

    const canvases = [
      { id: canvasId, name: 'With Files', createdAt: 1000, updatedAt: 1000 },
    ];

    const cache = await loadAllScenes(canvases);
    const scene = cache.get(canvasId);

    expect(scene).not.toBeNull();
    expect(scene!.files).toBeDefined();
    expect((scene!.files as Record<string, BinaryFileData>)['file-1']).toEqual(fileData);
  });
});

// ============================================================================
// Canvas Management Pure Functions Tests
// ============================================================================

describe('validateCreateCanvas', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'Second Canvas', createdAt: 2000, updatedAt: 2000 },
      ],
    };
  });

  it('should return valid for unique name', () => {
    const result = validateCreateCanvas(state, 'New Canvas');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for empty name', () => {
    const result = validateCreateCanvas(state, '');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Canvas name cannot be empty');
  });

  it('should return invalid for whitespace-only name', () => {
    const result = validateCreateCanvas(state, '   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Canvas name cannot be empty');
  });

  it('should return invalid for duplicate name', () => {
    const result = validateCreateCanvas(state, 'First Canvas');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Canvas "First Canvas" already exists');
  });

  it('should be case-insensitive for duplicate check', () => {
    const result = validateCreateCanvas(state, 'FIRST CANVAS');
    expect(result.valid).toBe(false);
  });

  it('should trim name before validation', () => {
    const result = validateCreateCanvas(state, '  Unique Name  ');
    expect(result.valid).toBe(true);
  });
});

describe('addCanvasToState', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
      ],
    };
  });

  it('should add new canvas to state', () => {
    const newCanvas = { id: 'canvas2', name: 'New Canvas', createdAt: 2000, updatedAt: 2000 };
    const newState = addCanvasToState(state, newCanvas);

    expect(newState.canvases).toHaveLength(2);
    expect(newState.canvases[1]).toEqual(newCanvas);
  });

  it('should not change activeCanvasId', () => {
    const newCanvas = { id: 'canvas2', name: 'New Canvas', createdAt: 2000, updatedAt: 2000 };
    const newState = addCanvasToState(state, newCanvas);

    expect(newState.activeCanvasId).toBe('canvas1');
  });

  it('should return new state object (immutability)', () => {
    const newCanvas = { id: 'canvas2', name: 'New Canvas', createdAt: 2000, updatedAt: 2000 };
    const newState = addCanvasToState(state, newCanvas);

    expect(newState).not.toBe(state);
    expect(newState.canvases).not.toBe(state.canvases);
  });
});

describe('validateSwitchCanvas', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'Second Canvas', createdAt: 2000, updatedAt: 2000 },
      ],
    };
  });

  it('should return valid with canvas for existing name', () => {
    const result = validateSwitchCanvas(state, 'Second Canvas', 'canvas1');
    expect(result.valid).toBe(true);
    expect(result.canvas?.id).toBe('canvas2');
    expect(result.alreadyActive).toBeUndefined();
  });

  it('should return invalid for non-existent canvas', () => {
    const result = validateSwitchCanvas(state, 'Non Existent', 'canvas1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Canvas "Non Existent" not found');
  });

  it('should return alreadyActive when switching to current canvas', () => {
    const result = validateSwitchCanvas(state, 'First Canvas', 'canvas1');
    expect(result.valid).toBe(true);
    expect(result.canvas?.id).toBe('canvas1');
    expect(result.alreadyActive).toBe(true);
  });

  it('should find canvas case-insensitively', () => {
    const result = validateSwitchCanvas(state, 'SECOND CANVAS', 'canvas1');
    expect(result.valid).toBe(true);
    expect(result.canvas?.id).toBe('canvas2');
  });
});

describe('validateRenameCanvas', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'Second Canvas', createdAt: 2000, updatedAt: 2000 },
      ],
    };
  });

  it('should return valid for unique name', () => {
    const result = validateRenameCanvas(state, 'New Name', 'canvas1');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for empty name', () => {
    const result = validateRenameCanvas(state, '', 'canvas1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Canvas name cannot be empty');
  });

  it('should return valid when renaming to same name', () => {
    const result = validateRenameCanvas(state, 'First Canvas', 'canvas1');
    expect(result.valid).toBe(true);
  });

  it('should return invalid when renaming to another canvas name', () => {
    const result = validateRenameCanvas(state, 'Second Canvas', 'canvas1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Canvas "Second Canvas" already exists');
  });
});

describe('renameCanvasInState', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'First Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'Second Canvas', createdAt: 2000, updatedAt: 2000 },
      ],
    };
  });

  it('should rename the specified canvas', () => {
    const result = renameCanvasInState(state, 'canvas1', 'Renamed Canvas');
    expect(result.canvas?.name).toBe('Renamed Canvas');
    expect(result.state.canvases[0].name).toBe('Renamed Canvas');
  });

  it('should update the timestamp', () => {
    const before = Date.now();
    const result = renameCanvasInState(state, 'canvas1', 'Renamed');
    const after = Date.now();

    expect(result.canvas?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(result.canvas?.updatedAt).toBeLessThanOrEqual(after);
  });

  it('should not modify other canvases', () => {
    const result = renameCanvasInState(state, 'canvas1', 'Renamed');
    expect(result.state.canvases[1].name).toBe('Second Canvas');
    expect(result.state.canvases[1].updatedAt).toBe(2000);
  });

  it('should trim the new name', () => {
    const result = renameCanvasInState(state, 'canvas1', '  Trimmed Name  ');
    expect(result.canvas?.name).toBe('Trimmed Name');
  });

  it('should return new state object (immutability)', () => {
    const result = renameCanvasInState(state, 'canvas1', 'Renamed');
    expect(result.state).not.toBe(state);
    expect(result.state.canvases).not.toBe(state.canvases);
  });
});

describe('generateUniqueCanvasName', () => {
  let state: CanvasListState;

  beforeEach(() => {
    state = {
      activeCanvasId: 'canvas1',
      canvases: [
        { id: 'canvas1', name: 'New Canvas', createdAt: 1000, updatedAt: 1000 },
        { id: 'canvas2', name: 'New Canvas 1', createdAt: 2000, updatedAt: 2000 },
        { id: 'canvas3', name: 'New Canvas 2', createdAt: 3000, updatedAt: 3000 },
      ],
    };
  });

  it('should return base name if unique', () => {
    const emptyState: CanvasListState = { activeCanvasId: '', canvases: [] };
    const name = generateUniqueCanvasName(emptyState, 'New Canvas');
    expect(name).toBe('New Canvas');
  });

  it('should append counter for duplicate names', () => {
    const name = generateUniqueCanvasName(state, 'New Canvas');
    expect(name).toBe('New Canvas 3');
  });

  it('should exclude specified ID from check', () => {
    const name = generateUniqueCanvasName(state, 'New Canvas', 'canvas1');
    // canvas1 has 'New Canvas', but it's excluded, so 'New Canvas' is available
    expect(name).toBe('New Canvas');
  });

  it('should handle different base names', () => {
    const name = generateUniqueCanvasName(state, 'My Project');
    expect(name).toBe('My Project');
  });
});
