import { describe, it, expect, vi, type Mock } from 'vitest';
import { renameCanvas, type RenameCanvasDeps, type RenameCanvasClient } from '../rename-canvas';

function createMockClient(sendFn?: Mock): RenameCanvasClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'Test' } })),
    close: vi.fn(),
  } as RenameCanvasClient;
}

function createMockDeps(overrides?: Partial<RenameCanvasDeps>): RenameCanvasDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('renameCanvas', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with newName', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'New Name' } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await renameCanvas({ newName: 'New Name' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'renameCanvas',
        id: 'test-id',
        params: {
          newName: 'New Name',
        },
      }));
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with new canvas name', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        canvas: { name: 'Renamed Canvas' },
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await renameCanvas({ newName: 'Renamed Canvas' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Canvas renamed to "Renamed Canvas"');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Name already in use',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await renameCanvas({ newName: 'Duplicate' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Name already in use');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'Test' } }));
      const mockClient = { send: mockSend, close: mockClose } as RenameCanvasClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await renameCanvas({ newName: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as RenameCanvasClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await renameCanvas({ newName: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
