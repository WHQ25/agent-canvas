import { describe, it, expect, vi, type Mock } from 'vitest';
import { rotateElements, type RotateElementsDeps, type RotateElementsClient } from '../rotate-elements';

function createMockClient(sendFn?: Mock): RotateElementsClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, rotatedCount: 2 })),
    close: vi.fn(),
  } as RotateElementsClient;
}

function createMockDeps(overrides?: Partial<RotateElementsDeps>): RotateElementsDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('rotateElements', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should parse comma-separated element IDs correctly', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, rotatedCount: 2 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: 'id1, id2', angle: 45 }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'rotateElements',
        id: 'test-id',
        params: {
          elementIds: ['id1', 'id2'],
          angle: 45,
        },
      }));
    });

    it('should pass angle correctly', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, rotatedCount: 1 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: 'id1', angle: 90 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.angle).toBe(90);
    });

    it('should handle negative angle', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, rotatedCount: 1 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: 'id1', angle: -45 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.angle).toBe(-45);
    });

    it('should trim whitespace from element IDs', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, rotatedCount: 2 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: '  id1  ,  id2  ', angle: 30 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.elementIds).toEqual(['id1', 'id2']);
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with rotated count', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, rotatedCount: 3 }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: 'id1,id2,id3', angle: 45 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Rotated 3 element(s)');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Cannot rotate text element',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: 'text-id', angle: 45 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Cannot rotate text element');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, rotatedCount: 1 }));
      const mockClient = { send: mockSend, close: mockClose } as RotateElementsClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: 'id1', angle: 90 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as RotateElementsClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await rotateElements({ elementIds: 'id1', angle: 45 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
