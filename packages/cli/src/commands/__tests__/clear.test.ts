import { describe, it, expect, vi, type Mock } from 'vitest';
import { clear, type ClearDeps, type ClearClient } from '../clear';

function createMockClient(sendFn?: Mock): ClearClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true })),
    close: vi.fn(),
  } as ClearClient;
}

function createMockDeps(overrides?: Partial<ClearDeps>): ClearDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('clear', () => {
  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message on success', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await clear(deps);

      expect(deps.log).toHaveBeenCalledWith('Canvas cleared');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Clear failed',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await clear(deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Clear failed');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = { send: mockSend, close: mockClose } as ClearClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await clear(deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ClearClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await clear(deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
