import { describe, it, expect, vi, type Mock } from 'vitest';
import { read, type ReadDeps, type ReadClient } from '../read';
import type { ToonResult } from '../../lib/toon-converter';

function createMockClient(sendFn?: Mock): ReadClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elements: [] })),
    close: vi.fn(),
  } as ReadClient;
}

function createMockDeps(overrides?: Partial<ReadDeps>): ReadDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    toToon: vi.fn((data) => JSON.stringify(data)),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('read', () => {
  // ==================== JSON Mode Tests ====================
  describe('json mode', () => {
    it('should call saveScene when --json is specified', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        data: { elements: [], appState: {} },
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({ json: true }, deps);

      expect(mockSend).toHaveBeenCalledWith({
        type: 'saveScene',
        id: 'test-id',
      });
    });

    it('should output JSON data on success', async () => {
      const sceneData = { elements: [{ id: 'el-1' }], appState: {} };
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        data: sceneData,
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({ json: true }, deps);

      expect(deps.log).toHaveBeenCalledWith(JSON.stringify(sceneData, null, 2));
    });

    it('should error and exit on json mode failure', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Connection lost',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({ json: true }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Connection lost');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });
  });

  // ==================== TOON Mode Tests ====================
  describe('toon mode (default)', () => {
    it('should call readScene in default mode', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elements: [],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({}, deps);

      expect(mockSend).toHaveBeenCalledWith({
        type: 'readScene',
        id: 'test-id',
      });
    });

    it('should call toToon with converted data', async () => {
      const mockToToon = vi.fn(() => 'toon-output');
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elements: [
          { id: 'rect-1', type: 'rectangle', x: 100, y: 200, width: 150, height: 80 },
        ],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        toToon: mockToToon,
      });

      await read({}, deps);

      expect(mockToToon).toHaveBeenCalled();
      const calls = mockToToon.mock.calls as unknown as [ToonResult][];
      const callArg = calls[0]?.[0];
      expect(callArg).toBeDefined();
      expect(callArg).toHaveProperty('shapes');
      expect(callArg).toHaveProperty('lines');
      expect(callArg).toHaveProperty('labels');
      expect(callArg).toHaveProperty('texts');
      expect(callArg).toHaveProperty('images');
      expect(callArg).toHaveProperty('groups');
    });

    it('should output TOON format on success', async () => {
      const mockToToon = vi.fn(() => 'formatted-toon-output');
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elements: [],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        toToon: mockToToon,
      });

      await read({}, deps);

      expect(deps.log).toHaveBeenCalledWith('formatted-toon-output');
    });

    it('should output selected elements when present', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elements: [],
        selectedElementIds: ['el-1', 'el-2'],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({}, deps);

      expect(deps.log).toHaveBeenCalledWith('\nSelected: el-1, el-2');
    });

    it('should not output selected elements when empty', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elements: [],
        selectedElementIds: [],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({}, deps);

      // Should only be called once (for the TOON output)
      expect(deps.log).toHaveBeenCalledTimes(1);
    });

    it('should error and exit on failure', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Read failed',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({}, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Read failed');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });
  });

  // ==================== withStyle Tests ====================
  describe('withStyle option', () => {
    it('should pass withStyle=false by default', async () => {
      const mockToToon = vi.fn(() => 'output');
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elements: [
          { id: 'rect-1', type: 'rectangle', x: 0, y: 0, strokeColor: '#ff0000' },
        ],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        toToon: mockToToon,
      });

      await read({}, deps);

      const calls = mockToToon.mock.calls as unknown as [ToonResult][];
      const callArg = calls[0]?.[0];
      expect(callArg).toBeDefined();
      expect(callArg!.shapes[0]).not.toHaveProperty('stroke');
    });

    it('should include style when withStyle=true', async () => {
      const mockToToon = vi.fn(() => 'output');
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elements: [
          { id: 'rect-1', type: 'rectangle', x: 0, y: 0, strokeColor: '#ff0000', backgroundColor: '#00ff00' },
        ],
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        toToon: mockToToon,
      });

      await read({ withStyle: true }, deps);

      const calls = mockToToon.mock.calls as unknown as [ToonResult][];
      const callArg = calls[0]?.[0];
      expect(callArg).toBeDefined();
      expect(callArg!.shapes[0].stroke).toBe('#ff0000');
      expect(callArg!.shapes[0].bg).toBe('#00ff00');
    });
  });

  // ==================== Client Lifecycle Tests ====================
  describe('client lifecycle', () => {
    it('should close client after json mode success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, data: {} }));
      const mockClient = { send: mockSend, close: mockClose } as ReadClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({ json: true }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after json mode failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ReadClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({ json: true }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after toon mode success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elements: [] }));
      const mockClient = { send: mockSend, close: mockClose } as ReadClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({}, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after toon mode failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ReadClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await read({}, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
