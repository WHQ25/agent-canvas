import { describe, it, expect, vi, type Mock } from 'vitest';
import { list, formatCanvasList, type ListDeps, type ListClient } from '../list';

function createMockClient(sendFn?: Mock): ListClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, canvases: [] })),
    close: vi.fn(),
  } as ListClient;
}

function createMockDeps(overrides?: Partial<ListDeps>): ListDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('list', () => {
  // ==================== Format Function Tests ====================
  describe('formatCanvasList', () => {
    it('should output header', () => {
      const lines = formatCanvasList({ canvases: [] });
      expect(lines[0]).toBe('Canvases: ([U]=User [A]=Agent)');
    });

    it('should mark canvas with [U] for user active', () => {
      const lines = formatCanvasList({
        activeCanvasId: 'canvas-1',
        canvases: [
          { id: 'canvas-1', name: 'Test Canvas', createdAt: 1000, updatedAt: 2000 },
        ],
      });
      expect(lines[1]).toContain('[U] ');
      expect(lines[1]).toContain('Test Canvas');
    });

    it('should mark canvas with [A] for agent active', () => {
      const lines = formatCanvasList({
        agentActiveCanvasId: 'canvas-1',
        canvases: [
          { id: 'canvas-1', name: 'Test Canvas', createdAt: 1000, updatedAt: 2000 },
        ],
      });
      expect(lines[1]).toContain('[A] ');
      expect(lines[1]).toContain('Test Canvas');
    });

    it('should mark canvas with [UA] for both user and agent active', () => {
      const lines = formatCanvasList({
        activeCanvasId: 'canvas-1',
        agentActiveCanvasId: 'canvas-1',
        canvases: [
          { id: 'canvas-1', name: 'Test Canvas', createdAt: 1000, updatedAt: 2000 },
        ],
      });
      expect(lines[1]).toContain('[UA]');
      expect(lines[1]).toContain('Test Canvas');
    });

    it('should not mark canvas when not active', () => {
      const lines = formatCanvasList({
        activeCanvasId: 'other-id',
        agentActiveCanvasId: 'another-id',
        canvases: [
          { id: 'canvas-1', name: 'Test Canvas', createdAt: 1000, updatedAt: 2000 },
        ],
      });
      expect(lines[1]).toMatch(/^    /);
      expect(lines[1]).toContain('Test Canvas');
    });

    it('should include canvas name and formatted date', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
      const lines = formatCanvasList({
        canvases: [
          { id: 'canvas-1', name: 'My Canvas', createdAt: 1000, updatedAt: timestamp },
        ],
      });
      expect(lines[1]).toContain('My Canvas');
      expect(lines[1]).toContain('(updated:');
    });
  });

  describe('folder display', () => {
    it('should display canvases grouped by folder when categories exist', () => {
      const lines = formatCanvasList({
        canvases: [
          { id: 'c1', name: 'Canvas A', createdAt: 1000, updatedAt: 2000 },
          { id: 'c2', name: 'Canvas B', createdAt: 1000, updatedAt: 3000 },
        ],
        categories: [
          { id: 'cat-1', name: 'Work', isCollapsed: false, order: 0 },
        ],
        canvasCategoryMap: { 'c1': 'cat-1' },
      });
      expect(lines).toContain('  [F] Work (1)');
      const ungroupedLine = lines.find(l => l.includes('Ungrouped'));
      expect(ungroupedLine).toContain('(1)');
    });

    it('should sort folders by order', () => {
      const lines = formatCanvasList({
        canvases: [
          { id: 'c1', name: 'Canvas A', createdAt: 1000, updatedAt: 2000 },
          { id: 'c2', name: 'Canvas B', createdAt: 1000, updatedAt: 3000 },
        ],
        categories: [
          { id: 'cat-2', name: 'Zebra', isCollapsed: false, order: 1 },
          { id: 'cat-1', name: 'Alpha', isCollapsed: false, order: 0 },
        ],
        canvasCategoryMap: { 'c1': 'cat-1', 'c2': 'cat-2' },
      });
      const alphaIdx = lines.findIndex(l => l.includes('Alpha'));
      const zebraIdx = lines.findIndex(l => l.includes('Zebra'));
      expect(alphaIdx).toBeLessThan(zebraIdx);
    });

    it('should indent canvases inside folders', () => {
      const lines = formatCanvasList({
        canvases: [
          { id: 'c1', name: 'Canvas A', createdAt: 1000, updatedAt: 2000 },
        ],
        categories: [
          { id: 'cat-1', name: 'Work', isCollapsed: false, order: 0 },
        ],
        canvasCategoryMap: { 'c1': 'cat-1' },
      });
      const canvasLine = lines.find(l => l.includes('Canvas A'));
      expect(canvasLine).toMatch(/^    /);
    });

    it('should not show ungrouped section when all canvases are categorized', () => {
      const lines = formatCanvasList({
        canvases: [
          { id: 'c1', name: 'Canvas A', createdAt: 1000, updatedAt: 2000 },
        ],
        categories: [
          { id: 'cat-1', name: 'Work', isCollapsed: false, order: 0 },
        ],
        canvasCategoryMap: { 'c1': 'cat-1' },
      });
      const ungroupedLine = lines.find(l => l.includes('Ungrouped'));
      expect(ungroupedLine).toBeUndefined();
    });

    it('should fall back to flat list when no categories', () => {
      const lines = formatCanvasList({
        canvases: [
          { id: 'c1', name: 'Canvas A', createdAt: 1000, updatedAt: 2000 },
          { id: 'c2', name: 'Canvas B', createdAt: 1000, updatedAt: 3000 },
        ],
        categories: [],
        canvasCategoryMap: {},
      });
      expect(lines).toHaveLength(3);
      expect(lines.find(l => l.includes('[F]'))).toBeUndefined();
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log each formatted line on success', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        activeCanvasId: 'canvas-1',
        canvases: [
          { id: 'canvas-1', name: 'Canvas 1', createdAt: 1000, updatedAt: 2000 },
          { id: 'canvas-2', name: 'Canvas 2', createdAt: 1000, updatedAt: 3000 },
        ],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await list(deps);

      // First call is header
      expect(deps.log).toHaveBeenCalledWith('Canvases: ([U]=User [A]=Agent)');
      // Should have called log 3 times (header + 2 canvases)
      expect(deps.log).toHaveBeenCalledTimes(3);
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Connection failed',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await list(deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Connection failed');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvases: [] }));
      const mockClient = { send: mockSend, close: mockClose } as ListClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await list(deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ListClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await list(deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should pass categories and canvasCategoryMap from response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        activeCanvasId: 'c1',
        canvases: [
          { id: 'c1', name: 'Canvas A', createdAt: 1000, updatedAt: 2000 },
        ],
        categories: [
          { id: 'cat-1', name: 'Work', isCollapsed: false, order: 0 },
        ],
        canvasCategoryMap: { 'c1': 'cat-1' },
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await list(deps);

      expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('[F] Work'));
    });
  });
});
