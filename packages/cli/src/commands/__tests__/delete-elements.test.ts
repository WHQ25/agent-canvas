import { describe, it, expect, vi, type Mock } from 'vitest';
import { deleteElements, type DeleteElementsDeps, type DeleteElementsClient } from '../delete-elements';

function createMockClient(sendFn?: Mock): DeleteElementsClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, deletedCount: 2 })),
    close: vi.fn(),
  } as DeleteElementsClient;
}

function createMockDeps(overrides?: Partial<DeleteElementsDeps>): DeleteElementsDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('deleteElements', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should parse comma-separated element IDs correctly', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, deletedCount: 3 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteElements({ elementIds: 'id1, id2, id3' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'deleteElements',
        id: 'test-id',
        params: {
          elementIds: ['id1', 'id2', 'id3'],
        },
      }));
    });

    it('should handle single element ID', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, deletedCount: 1 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteElements({ elementIds: 'single-id' }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.elementIds).toEqual(['single-id']);
    });

    it('should trim whitespace from element IDs', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, deletedCount: 2 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteElements({ elementIds: '  id1  ,  id2  ' }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.elementIds).toEqual(['id1', 'id2']);
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with deleted count', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, deletedCount: 5 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteElements({ elementIds: 'id1,id2,id3,id4,id5' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Deleted 5 element(s)');
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

      await deleteElements({ elementIds: 'invalid-id' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Element not found');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, deletedCount: 1 }));
      const mockClient = { send: mockSend, close: mockClose } as DeleteElementsClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteElements({ elementIds: 'id1' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as DeleteElementsClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteElements({ elementIds: 'id1' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
