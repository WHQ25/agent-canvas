import { describe, it, expect, vi, type Mock } from 'vitest';
import { useCanvas, type UseCanvasDeps, type UseCanvasClient } from '../use-canvas';

function createMockClient(sendFn?: Mock): UseCanvasClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'Test' } })),
    close: vi.fn(),
  } as UseCanvasClient;
}

function createMockDeps(overrides?: Partial<UseCanvasDeps>): UseCanvasDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('useCanvas', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with name', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'Target Canvas' } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await useCanvas({ name: 'Target Canvas' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'switchCanvas',
        id: 'test-id',
        params: {
          name: 'Target Canvas',
        },
      }));
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with canvas name', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        canvas: { name: 'My Canvas' },
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await useCanvas({ name: 'My Canvas' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Switched to canvas "My Canvas"');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Canvas not found',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await useCanvas({ name: 'Non-existent' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Canvas not found');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'Test' } }));
      const mockClient = { send: mockSend, close: mockClose } as UseCanvasClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await useCanvas({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as UseCanvasClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await useCanvas({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
