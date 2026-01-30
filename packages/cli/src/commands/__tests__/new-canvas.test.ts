import { describe, it, expect, vi, type Mock } from 'vitest';
import { newCanvas, type NewCanvasDeps, type NewCanvasClient } from '../new-canvas';

function createMockClient(sendFn?: Mock): NewCanvasClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'Test' } })),
    close: vi.fn(),
  } as NewCanvasClient;
}

function createMockDeps(overrides?: Partial<NewCanvasDeps>): NewCanvasDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('newCanvas', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with name and switchTo=false', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'My Canvas' } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await newCanvas({ name: 'My Canvas' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'createCanvas',
        id: 'test-id',
        params: {
          name: 'My Canvas',
          switchTo: false,
        },
      }));
    });

    it('should send switchTo=true when use is true', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'My Canvas' } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await newCanvas({ name: 'My Canvas', use: true }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        params: {
          name: 'My Canvas',
          switchTo: true,
        },
      }));
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message without switch text when use=false', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        canvas: { name: 'New Canvas' },
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await newCanvas({ name: 'New Canvas', use: false }, deps);

      expect(deps.log).toHaveBeenCalledWith('Canvas "New Canvas" created');
    });

    it('should log success message with switch text when use=true', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        canvas: { name: 'New Canvas' },
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await newCanvas({ name: 'New Canvas', use: true }, deps);

      expect(deps.log).toHaveBeenCalledWith('Canvas "New Canvas" created and switched to it');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Canvas name already exists',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await newCanvas({ name: 'Test' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Canvas name already exists');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, canvas: { name: 'Test' } }));
      const mockClient = { send: mockSend, close: mockClose } as NewCanvasClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await newCanvas({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as NewCanvasClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await newCanvas({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
