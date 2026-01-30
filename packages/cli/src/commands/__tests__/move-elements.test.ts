import { describe, it, expect, vi, type Mock } from 'vitest';
import { moveElements, type MoveElementsDeps, type MoveElementsClient } from '../move-elements';

function createMockClient(sendFn?: Mock): MoveElementsClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, movedCount: 2 })),
    close: vi.fn(),
  } as MoveElementsClient;
}

function createMockDeps(overrides?: Partial<MoveElementsDeps>): MoveElementsDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('moveElements', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should parse comma-separated element IDs correctly', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, movedCount: 2 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: 'id1, id2', deltaX: 100, deltaY: 50 }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'moveElements',
        id: 'test-id',
        params: {
          elementIds: ['id1', 'id2'],
          deltaX: 100,
          deltaY: 50,
        },
      }));
    });

    it('should pass deltaX and deltaY correctly', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, movedCount: 1 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: 'id1', deltaX: 200, deltaY: -100 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.deltaX).toBe(200);
      expect(callParams.deltaY).toBe(-100);
    });

    it('should handle negative deltas', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, movedCount: 1 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: 'id1', deltaX: -50, deltaY: -75 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.deltaX).toBe(-50);
      expect(callParams.deltaY).toBe(-75);
    });

    it('should trim whitespace from element IDs', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, movedCount: 3 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: '  id1  ,  id2  ,  id3  ', deltaX: 10, deltaY: 20 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.elementIds).toEqual(['id1', 'id2', 'id3']);
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with moved count', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, movedCount: 4 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: 'id1,id2,id3,id4', deltaX: 50, deltaY: 50 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Moved 4 element(s)');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Element not found',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: 'invalid-id', deltaX: 10, deltaY: 10 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Element not found');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, movedCount: 1 }));
      const mockClient = { send: mockSend, close: mockClose } as MoveElementsClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: 'id1', deltaX: 10, deltaY: 20 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as MoveElementsClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveElements({ elementIds: 'id1', deltaX: 0, deltaY: 0 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
