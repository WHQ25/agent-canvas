import { describe, it, expect, vi, type Mock } from 'vitest';
import { ungroupElement, type UngroupElementDeps, type UngroupClient } from '../ungroup-element';

function createMockClient(sendFn?: Mock): UngroupClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true })),
    close: vi.fn(),
  } as UngroupClient;
}

function createMockDeps(overrides?: Partial<UngroupElementDeps>): UngroupElementDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('ungroupElement', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with elementId', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await ungroupElement({ elementId: 'el-123' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'ungroupElement',
        id: 'test-id',
        params: {
          elementId: 'el-123',
        },
      }));
    });

    it('should pass elementId correctly', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await ungroupElement({ elementId: 'complex-element-id-abc' }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.elementId).toBe('complex-element-id-abc');
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await ungroupElement({ elementId: 'el-1' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Element ungrouped');
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

      await ungroupElement({ elementId: 'non-existent' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Element not found');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = { send: mockSend, close: mockClose } as UngroupClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await ungroupElement({ elementId: 'el-1' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as UngroupClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await ungroupElement({ elementId: 'el-1' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
