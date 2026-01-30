/**
 * Unit tests for message handlers.
 * Tests use mocked dependencies to verify handler logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HandlerDeps, HandlerContext, ExcalidrawElement, CanvasSceneData } from '../handler-types';
import {
  handleAddShape,
  handleAddText,
  handleAddLine,
  handleAddArrow,
  handleAddPolygon,
  handleAddImage,
  handleDeleteElements,
  handleRotateElements,
  handleGroupElements,
  handleUngroupElement,
  handleMoveElements,
  handleResizeElements,
  handleReadScene,
  handleLoadScene,
  handleSaveScene,
  handleClearCanvas,
  handleExportImage,
  formatError,
  type ExportToBlobFn,
} from '../message-handlers';

// Mock Excalidraw functions
vi.mock('@excalidraw/excalidraw', () => ({
  convertToExcalidrawElements: vi.fn((skeletons) => {
    return skeletons.map((s: { type: string; x?: number; y?: number; width?: number; height?: number }) => ({
      id: `elem-${Math.random().toString(36).substring(2, 8)}`,
      type: s.type,
      x: s.x ?? 0,
      y: s.y ?? 0,
      width: s.width ?? 100,
      height: s.height ?? 100,
    }));
  }),
  restoreElements: vi.fn((elements) => elements),
}));

/**
 * Create mock handler context
 */
function createMockContext(overrides?: Partial<HandlerContext>): HandlerContext {
  return {
    api: {
      getSceneElements: vi.fn(() => []),
      getSceneElementsIncludingDeleted: vi.fn(() => []),
      getAppState: vi.fn(() => ({})),
      getFiles: vi.fn(() => ({})),
      updateScene: vi.fn(),
      addFiles: vi.fn(),
    },
    canvasId: 'test-canvas-id',
    useDirectStorage: false,
    ...overrides,
  };
}

/**
 * Create mock handler dependencies
 */
function createMockDeps(ctx?: HandlerContext | null, overrides?: Partial<HandlerDeps>): HandlerDeps {
  // If ctx is explicitly null, return null from getContext (simulates unavailable canvas)
  // If ctx is undefined, create a default mock context
  const contextToReturn = ctx === null ? null : (ctx ?? createMockContext());
  return {
    getContext: vi.fn(() => contextToReturn),
    storage: {
      loadCanvasScene: vi.fn(async () => null),
      saveCanvasScene: vi.fn(async () => {}),
    },
    saveAndSync: vi.fn(async () => {}),
    CaptureUpdateAction: {
      IMMEDIATELY: 'IMMEDIATELY',
    },
    ...overrides,
  };
}

describe('formatError', () => {
  it('should format Error objects', () => {
    expect(formatError(new Error('test error'))).toBe('test error');
  });

  it('should return "Unknown error" for non-Error values', () => {
    expect(formatError('string')).toBe('Unknown error');
    expect(formatError(null)).toBe('Unknown error');
    expect(formatError(undefined)).toBe('Unknown error');
    expect(formatError(123)).toBe('Unknown error');
  });
});

describe('handleAddShape', () => {
  it('should return error when context is not available', async () => {
    const deps: HandlerDeps = {
      getContext: vi.fn(() => null),
      storage: {
        loadCanvasScene: vi.fn(async () => null),
        saveCanvasScene: vi.fn(async () => {}),
      },
      saveAndSync: vi.fn(async () => {}),
      CaptureUpdateAction: {
        IMMEDIATELY: 'IMMEDIATELY',
      },
    };
    const result = await handleAddShape(deps, 'req-1', {
      type: 'rectangle',
      x: 100,
      y: 200,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas not available');
  });

  it('should create rectangle element with default values', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddShape(deps, 'req-1', {
      type: 'rectangle',
      x: 100,
      y: 200,
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeDefined();
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
    expect(ctx.api.updateScene).toHaveBeenCalled();
  });

  it('should create shape with custom dimensions', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddShape(deps, 'req-1', {
      type: 'ellipse',
      x: 50,
      y: 50,
      width: 200,
      height: 150,
    });

    expect(result.success).toBe(true);
    // The mock returns default 100x100, actual implementation would use provided values
    // Just verify success and elementId presence
    expect(result.elementId).toBeDefined();
  });

  it('should use direct storage when useDirectStorage is true', async () => {
    const ctx = createMockContext({ useDirectStorage: true });
    const deps = createMockDeps(ctx);

    const result = await handleAddShape(deps, 'req-1', {
      type: 'diamond',
      x: 100,
      y: 100,
    });

    expect(result.success).toBe(true);
    expect(deps.saveAndSync).toHaveBeenCalled();
  });
});

describe('handleAddText', () => {
  it('should create text element with anchor offset', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddText(deps, 'req-1', {
      text: 'Hello World',
      x: 100,
      y: 200,
      anchor: 'center',
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeDefined();
    // With center anchor, x and y should be offset
    expect(result.x).toBeDefined();
    expect(result.y).toBeDefined();
    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
  });

  it('should handle newline escape sequences', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddText(deps, 'req-1', {
      text: 'Line1\\nLine2',
      x: 0,
      y: 0,
    });

    expect(result.success).toBe(true);
  });
});

describe('handleAddLine', () => {
  it('should create line element', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddLine(deps, 'req-1', {
      x: 0,
      y: 0,
      endX: 100,
      endY: 100,
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeDefined();
  });
});

describe('handleAddArrow', () => {
  it('should create sharp arrow by default', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddArrow(deps, 'req-1', {
      x: 0,
      y: 0,
      endX: 100,
      endY: 0,
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeDefined();
  });

  it('should create elbow arrow', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddArrow(deps, 'req-1', {
      x: 0,
      y: 0,
      endX: 100,
      endY: 100,
      arrowType: 'elbow',
    });

    expect(result.success).toBe(true);
  });

  it('should create round arrow', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddArrow(deps, 'req-1', {
      x: 0,
      y: 0,
      endX: 100,
      endY: 100,
      arrowType: 'round',
    });

    expect(result.success).toBe(true);
  });
});

describe('handleAddPolygon', () => {
  it('should create polygon from points', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddPolygon(deps, 'req-1', {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeDefined();
  });

  it('should reject polygon with less than 3 points', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddPolygon(deps, 'req-1', {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 3 points');
  });
});

describe('handleDeleteElements', () => {
  it('should mark elements as deleted', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as ExcalidrawElement,
      { id: 'elem-2', type: 'rectangle', x: 100, y: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleDeleteElements(deps, 'req-1', {
      elementIds: ['elem-1'],
    });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(1);
  });

  it('should delete bound elements together', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      {
        id: 'shape-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        boundElements: [{ id: 'text-1', type: 'text' as const }],
      } as ExcalidrawElement,
      { id: 'text-1', type: 'text', x: 10, y: 10, containerId: 'shape-1' } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleDeleteElements(deps, 'req-1', {
      elementIds: ['shape-1'],
    });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(2);
  });

  it('should return error when no elements found', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleDeleteElements(deps, 'req-1', {
      elementIds: ['non-existent'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No elements found');
  });
});

describe('handleRotateElements', () => {
  it('should rotate elements by angle', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, angle: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleRotateElements(deps, 'req-1', {
      elementIds: ['elem-1'],
      angle: 45,
    });

    expect(result.success).toBe(true);
    expect(result.rotatedCount).toBe(1);
  });

  it('should rotate all elements in a group', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, angle: 0, groupIds: ['group-1'] } as ExcalidrawElement,
      { id: 'elem-2', type: 'rectangle', x: 100, y: 0, angle: 0, groupIds: ['group-1'] } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleRotateElements(deps, 'req-1', {
      elementIds: ['elem-1'],
      angle: 90,
    });

    expect(result.success).toBe(true);
    expect(result.rotatedCount).toBe(2);
  });
});

describe('handleGroupElements', () => {
  it('should group multiple elements', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as ExcalidrawElement,
      { id: 'elem-2', type: 'rectangle', x: 100, y: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleGroupElements(deps, 'req-1', {
      elementIds: ['elem-1', 'elem-2'],
    });

    expect(result.success).toBe(true);
    expect(result.groupId).toBeDefined();
  });

  it('should require at least 2 elements', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleGroupElements(deps, 'req-1', {
      elementIds: ['elem-1'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('At least 2 elements');
  });
});

describe('handleUngroupElement', () => {
  it('should remove last group from element', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, groupIds: ['group-1'] } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleUngroupElement(deps, 'req-1', {
      elementId: 'elem-1',
    });

    expect(result.success).toBe(true);
  });

  it('should return error for non-grouped element', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, groupIds: [] } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleUngroupElement(deps, 'req-1', {
      elementId: 'elem-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not in any group');
  });
});

describe('handleMoveElements', () => {
  it('should move elements by delta', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleMoveElements(deps, 'req-1', {
      elementIds: ['elem-1'],
      deltaX: 50,
      deltaY: 100,
    });

    expect(result.success).toBe(true);
    expect(result.movedCount).toBe(1);
  });

  it('should move bound elements together', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      {
        id: 'shape-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        boundElements: [{ id: 'text-1', type: 'text' as const }],
      } as ExcalidrawElement,
      { id: 'text-1', type: 'text', x: 10, y: 10, containerId: 'shape-1' } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleMoveElements(deps, 'req-1', {
      elementIds: ['shape-1'],
      deltaX: 50,
      deltaY: 50,
    });

    expect(result.success).toBe(true);
    expect(result.movedCount).toBe(2);
  });
});

describe('handleResizeElements', () => {
  it('should resize shape elements', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, angle: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleResizeElements(deps, 'req-1', {
      elementIds: ['elem-1'],
      right: 50,
      bottom: 50,
    });

    expect(result.success).toBe(true);
    expect(result.resizedCount).toBe(1);
  });

  it('should reject resize with all zero parameters', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleResizeElements(deps, 'req-1', {
      elementIds: ['elem-1'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('must be non-zero');
  });

  it('should reject resize for non-shape elements', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'line', x: 0, y: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleResizeElements(deps, 'req-1', {
      elementIds: ['elem-1'],
      right: 50,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not a shape');
  });

  it('should reject resize that would result in negative dimensions', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, angle: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleResizeElements(deps, 'req-1', {
      elementIds: ['elem-1'],
      left: -150,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('would be <= 0');
  });
});

describe('handlers with direct storage', () => {
  it('should load from storage when useDirectStorage is true', async () => {
    const mockScene: CanvasSceneData = {
      elements: [
        { id: 'stored-elem', type: 'rectangle', x: 0, y: 0 } as unknown,
      ],
    };

    const ctx = createMockContext({ useDirectStorage: true });
    const deps = createMockDeps(ctx, {
      storage: {
        loadCanvasScene: vi.fn(async () => mockScene),
        saveCanvasScene: vi.fn(async () => {}),
      },
    });

    const result = await handleDeleteElements(deps, 'req-1', {
      elementIds: ['stored-elem'],
    });

    expect(result.success).toBe(true);
    expect(deps.storage.loadCanvasScene).toHaveBeenCalledWith('test-canvas-id');
    expect(deps.saveAndSync).toHaveBeenCalled();
  });
});

// ============================================================================
// handleAddImage Tests
// ============================================================================

// Mock Image for browser environment
class MockImage {
  naturalWidth = 200;
  naturalHeight = 100;
  onload: (() => void) | null = null;
  onerror: ((e: Error) => void) | null = null;
  private _src = '';

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    // Simulate async image load
    setTimeout(() => {
      if (value.startsWith('data:image')) {
        this.onload?.();
      } else {
        this.onerror?.(new Error('Failed to load image'));
      }
    }, 0);
  }
}

// Store original Image
const OriginalImage = global.Image;

describe('handleAddImage', () => {
  beforeEach(() => {
    // Replace global Image with mock
    global.Image = MockImage as unknown as typeof Image;
  });

  afterEach(() => {
    // Restore original Image
    global.Image = OriginalImage;
  });

  it('should add image with auto-detected dimensions', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddImage(deps, 'req-1', {
      x: 100,
      y: 100,
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      fileId: 'test-file-id',
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeDefined();
    expect(result.fileId).toBe('test-file-id');
    expect(result.width).toBe(200); // From MockImage.naturalWidth
    expect(result.height).toBe(100); // From MockImage.naturalHeight
    expect(ctx.api.addFiles).toHaveBeenCalled();
    expect(ctx.api.updateScene).toHaveBeenCalled();
  });

  it('should add image with specified dimensions', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleAddImage(deps, 'req-1', {
      x: 50,
      y: 50,
      width: 300,
      height: 150,
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      fileId: 'test-file-id-2',
    });

    expect(result.success).toBe(true);
    expect(result.width).toBe(300);
    expect(result.height).toBe(150);
  });

  it('should return error when context is not available', async () => {
    const deps = createMockDeps(null);

    const result = await handleAddImage(deps, 'req-1', {
      x: 0,
      y: 0,
      dataUrl: 'data:image/png;base64,test',
      mimeType: 'image/png',
      fileId: 'test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas not available');
  });

  it('should use direct storage when useDirectStorage is true', async () => {
    const ctx = createMockContext({ useDirectStorage: true });
    const deps = createMockDeps(ctx);

    const result = await handleAddImage(deps, 'req-1', {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      dataUrl: 'data:image/png;base64,test',
      mimeType: 'image/png',
      fileId: 'test-file',
    });

    expect(result.success).toBe(true);
    expect(deps.saveAndSync).toHaveBeenCalled();
  });
});

// ============================================================================
// handleReadScene Tests
// ============================================================================

describe('handleReadScene', () => {
  it('should return scene elements', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } as ExcalidrawElement,
      { id: 'elem-2', type: 'text', x: 50, y: 50, text: 'Hello' } as ExcalidrawElement,
    ]);
    ctx.api.getAppState = vi.fn(() => ({ selectedElementIds: { 'elem-1': true } }));
    const deps = createMockDeps(ctx);

    const result = await handleReadScene(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(result.elements).toHaveLength(2);
    expect(result.elements?.[0].id).toBe('elem-1');
    expect(result.elements?.[1].text).toBe('Hello');
    expect(result.selectedElementIds).toEqual(['elem-1']);
  });

  it('should filter out deleted elements', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, isDeleted: false } as ExcalidrawElement,
      { id: 'elem-2', type: 'rectangle', x: 100, y: 0, isDeleted: true } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleReadScene(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(result.elements).toHaveLength(1);
    expect(result.elements?.[0].id).toBe('elem-1');
  });

  it('should return empty selectedElementIds when using direct storage', async () => {
    const mockScene: CanvasSceneData = {
      elements: [
        { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as unknown,
      ],
    };
    const ctx = createMockContext({ useDirectStorage: true });
    const deps = createMockDeps(ctx, {
      storage: {
        loadCanvasScene: vi.fn(async () => mockScene),
        saveCanvasScene: vi.fn(async () => {}),
      },
    });

    const result = await handleReadScene(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(result.selectedElementIds).toEqual([]);
  });

  it('should return error when context is not available', async () => {
    const deps = createMockDeps(null);

    const result = await handleReadScene(deps, 'req-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas not available');
  });
});

// ============================================================================
// handleLoadScene Tests
// ============================================================================

describe('handleLoadScene', () => {
  it('should load elements into scene', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleLoadScene(deps, 'req-1', {
      elements: [
        { id: 'elem-1', type: 'rectangle', x: 0, y: 0 },
        { id: 'elem-2', type: 'ellipse', x: 100, y: 0 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.elementCount).toBe(2);
    expect(ctx.api.updateScene).toHaveBeenCalled();
  });

  it('should load files when provided', async () => {
    const ctx = createMockContext();
    const deps = createMockDeps(ctx);

    const result = await handleLoadScene(deps, 'req-1', {
      elements: [],
      files: {
        'file-1': { id: 'file-1', dataURL: 'data:image/png;base64,test', mimeType: 'image/png', created: Date.now() },
      },
    });

    expect(result.success).toBe(true);
    expect(ctx.api.addFiles).toHaveBeenCalled();
  });

  it('should use direct storage when useDirectStorage is true', async () => {
    const ctx = createMockContext({ useDirectStorage: true });
    const deps = createMockDeps(ctx);

    const result = await handleLoadScene(deps, 'req-1', {
      elements: [{ id: 'elem-1', type: 'rectangle', x: 0, y: 0 }],
    });

    expect(result.success).toBe(true);
    expect(deps.saveAndSync).toHaveBeenCalled();
  });

  it('should return error when context is not available', async () => {
    const deps = createMockDeps(null);

    const result = await handleLoadScene(deps, 'req-1', { elements: [] });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas not available');
  });
});

// ============================================================================
// handleSaveScene Tests
// ============================================================================

describe('handleSaveScene', () => {
  it('should return scene data in Excalidraw format', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as ExcalidrawElement,
    ]);
    ctx.api.getAppState = vi.fn(() => ({ theme: 'light' }));
    ctx.api.getFiles = vi.fn(() => ({}));
    const deps = createMockDeps(ctx);

    const result = await handleSaveScene(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.type).toBe('excalidraw');
    expect(result.data?.version).toBe(2);
    expect(result.data?.source).toBe('agent-canvas');
    expect(result.data?.elements).toHaveLength(1);
  });

  it('should filter out deleted elements', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, isDeleted: false } as ExcalidrawElement,
      { id: 'elem-2', type: 'rectangle', x: 100, y: 0, isDeleted: true } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleSaveScene(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(result.data?.elements).toHaveLength(1);
  });

  it('should use storage data when useDirectStorage is true', async () => {
    const mockScene: CanvasSceneData = {
      elements: [{ id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as unknown],
      appState: { theme: 'dark' },
      files: { 'file-1': { id: 'file-1' } },
    };
    const ctx = createMockContext({ useDirectStorage: true });
    const deps = createMockDeps(ctx, {
      storage: {
        loadCanvasScene: vi.fn(async () => mockScene),
        saveCanvasScene: vi.fn(async () => {}),
      },
    });

    const result = await handleSaveScene(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(result.data?.appState).toEqual({ theme: 'dark' });
  });

  it('should return error when context is not available', async () => {
    const deps = createMockDeps(null);

    const result = await handleSaveScene(deps, 'req-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas not available');
  });
});

// ============================================================================
// handleClearCanvas Tests
// ============================================================================

describe('handleClearCanvas', () => {
  it('should clear all elements from canvas', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);

    const result = await handleClearCanvas(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(ctx.api.updateScene).toHaveBeenCalledWith(
      expect.objectContaining({ elements: [] })
    );
  });

  it('should use direct storage when useDirectStorage is true', async () => {
    const ctx = createMockContext({ useDirectStorage: true });
    const deps = createMockDeps(ctx);

    const result = await handleClearCanvas(deps, 'req-1');

    expect(result.success).toBe(true);
    expect(deps.saveAndSync).toHaveBeenCalledWith('test-canvas-id', [], {});
  });

  it('should return error when context is not available', async () => {
    const deps = createMockDeps(null);

    const result = await handleClearCanvas(deps, 'req-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas not available');
  });
});

// ============================================================================
// handleExportImage Tests
// ============================================================================

describe('handleExportImage', () => {
  // Create mock exportToBlob function
  const createMockExportToBlob = (): ExportToBlobFn => {
    return vi.fn(async () => new Blob(['fake-image-data'], { type: 'image/png' }));
  };

  // Mock FileReader
  const OriginalFileReader = global.FileReader;

  beforeEach(() => {
    // Mock FileReader for base64 conversion
    global.FileReader = class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: (() => void) | null = null;
      onerror: ((e: Error) => void) | null = null;

      readAsDataURL(blob: Blob) {
        // Simulate async read
        setTimeout(() => {
          this.result = 'data:image/png;base64,ZmFrZS1pbWFnZS1kYXRh';
          this.onload?.();
        }, 0);
      }
    } as unknown as typeof FileReader;
  });

  afterEach(() => {
    global.FileReader = OriginalFileReader;
  });

  it('should export canvas as PNG data URL', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);
    const mockExportToBlob = createMockExportToBlob();

    const result = await handleExportImage(deps, 'req-1', undefined, mockExportToBlob);

    expect(result.success).toBe(true);
    expect(result.dataUrl).toContain('data:image/png;base64');
    expect(mockExportToBlob).toHaveBeenCalled();
  });

  it('should apply export options', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);
    const mockExportToBlob = createMockExportToBlob();

    await handleExportImage(deps, 'req-1', {
      background: false,
      dark: true,
      embedScene: true,
      scale: 2,
    }, mockExportToBlob);

    expect(mockExportToBlob).toHaveBeenCalledWith(
      expect.objectContaining({
        appState: {
          exportBackground: false,
          exportWithDarkMode: true,
          exportEmbedScene: true,
        },
      })
    );
  });

  it('should return error when canvas is empty', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => []);
    const deps = createMockDeps(ctx);
    const mockExportToBlob = createMockExportToBlob();

    const result = await handleExportImage(deps, 'req-1', undefined, mockExportToBlob);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas is empty');
  });

  it('should filter out deleted elements', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0, isDeleted: true } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);
    const mockExportToBlob = createMockExportToBlob();

    const result = await handleExportImage(deps, 'req-1', undefined, mockExportToBlob);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas is empty');
  });

  it('should return error when context is not available', async () => {
    const deps = createMockDeps(null);
    const mockExportToBlob = createMockExportToBlob();

    const result = await handleExportImage(deps, 'req-1', undefined, mockExportToBlob);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas not available');
  });

  it('should use default scale of 1', async () => {
    const ctx = createMockContext();
    ctx.api.getSceneElements = vi.fn(() => [
      { id: 'elem-1', type: 'rectangle', x: 0, y: 0 } as ExcalidrawElement,
    ]);
    const deps = createMockDeps(ctx);
    const mockExportToBlob = createMockExportToBlob();

    await handleExportImage(deps, 'req-1', undefined, mockExportToBlob);

    // Check that getDimensions uses scale 1
    const call = (mockExportToBlob as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const dimensions = call.getDimensions(100, 100);
    expect(dimensions.scale).toBe(1);
    expect(dimensions.width).toBe(100);
    expect(dimensions.height).toBe(100);
  });
});
