import { describe, it, expect, vi, type Mock } from 'vitest';
import { load, type LoadDeps, type LoadClient } from '../load';

function createMockClient(sendFn?: Mock): LoadClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elementCount: 5 })),
    close: vi.fn(),
  } as LoadClient;
}

function createMockDeps(overrides?: Partial<LoadDeps>): LoadDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    readFile: vi.fn(() => JSON.stringify({ elements: [{ id: 'el-1' }] })),
    existsSync: vi.fn(() => true),
    resolvePath: vi.fn((p: string) => `/absolute/path/${p}`),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('load', () => {
  // ==================== Input Validation Tests ====================
  describe('input validation', () => {
    it('should error and exit when filepath is not provided', async () => {
      const deps = createMockDeps();

      await load(undefined, deps);

      expect(deps.error).toHaveBeenCalledWith('Usage: agent-canvas load <filepath>');
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });

    it('should error and exit when file does not exist', async () => {
      const deps = createMockDeps({
        existsSync: vi.fn(() => false),
        resolvePath: vi.fn(() => '/path/to/missing.excalidraw'),
      });

      await load('missing.excalidraw', deps);

      expect(deps.error).toHaveBeenCalledWith('File not found: /path/to/missing.excalidraw');
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });

    it('should error and exit when file cannot be read', async () => {
      const deps = createMockDeps({
        readFile: vi.fn(() => { throw new Error('Permission denied'); }),
      });

      await load('test.excalidraw', deps);

      expect(deps.error).toHaveBeenCalledWith('Failed to read file: Permission denied');
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });

    it('should error and exit when file contains invalid JSON', async () => {
      const deps = createMockDeps({
        readFile: vi.fn(() => '{ invalid json }'),
      });

      await load('test.excalidraw', deps);

      expect(deps.error).toHaveBeenCalledWith(expect.stringMatching(/^Failed to parse file:/));
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });
  });

  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should resolve filepath to absolute path', async () => {
      const mockResolvePath = vi.fn(() => '/absolute/path/test.excalidraw');
      const deps = createMockDeps({ resolvePath: mockResolvePath });

      await load('test.excalidraw', deps);

      expect(mockResolvePath).toHaveBeenCalledWith('test.excalidraw');
      expect(deps.existsSync).toHaveBeenCalledWith('/absolute/path/test.excalidraw');
      expect(deps.readFile).toHaveBeenCalledWith('/absolute/path/test.excalidraw', 'utf-8');
    });

    it('should send loadScene message with parsed elements', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementCount: 2 }));
      const mockClient = createMockClient(mockSend);
      const sceneData = {
        elements: [{ id: 'el-1' }, { id: 'el-2' }],
        appState: { viewBackgroundColor: '#ffffff' },
        files: { 'file-1': { mimeType: 'image/png' } },
      };
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        readFile: vi.fn(() => JSON.stringify(sceneData)),
      });

      await load('scene.excalidraw', deps);

      expect(mockSend).toHaveBeenCalledWith({
        type: 'loadScene',
        id: 'test-id',
        params: {
          elements: sceneData.elements,
          appState: sceneData.appState,
          files: sceneData.files,
        },
      });
    });

    it('should default to empty array when elements is missing', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementCount: 0 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        readFile: vi.fn(() => JSON.stringify({ appState: {} })),
      });

      await load('empty.excalidraw', deps);

      expect(mockSend).toHaveBeenCalledWith({
        type: 'loadScene',
        id: 'test-id',
        params: {
          elements: [],
          appState: {},
          files: undefined,
        },
      });
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with element count', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementCount: 10 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await load('scene.excalidraw', deps);

      expect(deps.log).toHaveBeenCalledWith('Loaded 10 elements from scene.excalidraw');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Invalid scene format',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await load('bad.excalidraw', deps);

      expect(deps.error).toHaveBeenCalledWith('Failed to load file: Invalid scene format');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementCount: 5 }));
      const mockClient = { send: mockSend, close: mockClose } as LoadClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await load('scene.excalidraw', deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as LoadClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await load('scene.excalidraw', deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
