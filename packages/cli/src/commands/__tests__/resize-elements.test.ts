import { describe, it, expect, vi, type Mock } from 'vitest';
import { resizeElements, type ResizeElementsDeps, type ResizeClient } from '../resize-elements';

function createMockClient(sendFn?: Mock): ResizeClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, resizedCount: 2 })),
    close: vi.fn(),
  } as ResizeClient;
}

function createMockDeps(overrides?: Partial<ResizeElementsDeps>): ResizeElementsDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('resizeElements', () => {
  // ==================== Input Validation Tests ====================
  describe('input validation', () => {
    it('should error when all direction params are unspecified (default to 0)', async () => {
      const deps = createMockDeps();

      await resizeElements({ elementIds: ['el-1', 'el-2'] }, deps);

      expect(deps.error).toHaveBeenCalledWith('At least one of --top, --bottom, --left, --right must be specified');
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });

    it('should error when all direction params are explicitly 0', async () => {
      const deps = createMockDeps();

      await resizeElements({
        elementIds: ['el-1'],
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }, deps);

      expect(deps.error).toHaveBeenCalledWith('At least one of --top, --bottom, --left, --right must be specified');
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });
  });

  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with elementIds and single direction', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, resizedCount: 1 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await resizeElements({
        elementIds: ['el-1', 'el-2'],
        top: 50,
      }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'resizeElements',
        id: 'test-id',
        params: {
          elementIds: ['el-1', 'el-2'],
          top: 50,
          bottom: 0,
          left: 0,
          right: 0,
        },
      }));
    });

    it('should send correct params with all directions', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, resizedCount: 2 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await resizeElements({
        elementIds: ['el-1'],
        top: 10,
        bottom: 20,
        left: 30,
        right: 40,
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.elementIds).toEqual(['el-1']);
      expect(callParams.top).toBe(10);
      expect(callParams.bottom).toBe(20);
      expect(callParams.left).toBe(30);
      expect(callParams.right).toBe(40);
    });

    it('should default unspecified directions to 0', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, resizedCount: 1 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await resizeElements({
        elementIds: ['el-1'],
        left: 25,
        right: -10,
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.top).toBe(0);
      expect(callParams.bottom).toBe(0);
      expect(callParams.left).toBe(25);
      expect(callParams.right).toBe(-10);
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with count', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, resizedCount: 3 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await resizeElements({ elementIds: ['el-1', 'el-2', 'el-3'], top: 10 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Resized 3 element(s)');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Invalid element ID',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await resizeElements({ elementIds: ['invalid'], bottom: 5 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Invalid element ID');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, resizedCount: 1 }));
      const mockClient = { send: mockSend, close: mockClose } as ResizeClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await resizeElements({ elementIds: ['el-1'], top: 10 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ResizeClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await resizeElements({ elementIds: ['el-1'], top: 10 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
