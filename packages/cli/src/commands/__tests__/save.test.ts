import { describe, it, expect, vi, type Mock } from 'vitest';
import { save, type SaveDeps, type SaveClient } from '../save';

function createMockClient(sendFn?: Mock): SaveClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, data: { elements: [] } })),
    close: vi.fn(),
  } as SaveClient;
}

function createMockDeps(overrides?: Partial<SaveDeps>): SaveDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    writeFile: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('save', () => {
  // ==================== Parameter/Logic Tests ====================
  describe('filepath handling', () => {
    it('should auto-add .excalidraw extension if not present', async () => {
      const mockWriteFile = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, data: { elements: [] } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        writeFile: mockWriteFile,
      });

      await save('mycanvas', deps);

      expect(mockWriteFile).toHaveBeenCalledWith(
        'mycanvas.excalidraw',
        expect.any(String)
      );
      expect(deps.log).toHaveBeenCalledWith('Saved to mycanvas.excalidraw');
    });

    it('should not add extension if .excalidraw already present', async () => {
      const mockWriteFile = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, data: { elements: [] } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        writeFile: mockWriteFile,
      });

      await save('mycanvas.excalidraw', deps);

      expect(mockWriteFile).toHaveBeenCalledWith(
        'mycanvas.excalidraw',
        expect.any(String)
      );
      expect(deps.log).toHaveBeenCalledWith('Saved to mycanvas.excalidraw');
    });

    it('should write JSON data correctly', async () => {
      const mockWriteFile = vi.fn();
      const sceneData = { elements: [{ id: 'el-1' }], appState: {} };
      const mockSend = vi.fn(() => Promise.resolve({ success: true, data: sceneData }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        writeFile: mockWriteFile,
      });

      await save('test', deps);

      expect(mockWriteFile).toHaveBeenCalledWith(
        'test.excalidraw',
        JSON.stringify(sceneData, null, 2)
      );
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message on success', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, data: { elements: [] } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await save('output', deps);

      expect(deps.log).toHaveBeenCalledWith('Saved to output.excalidraw');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Connection lost',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await save('output', deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Connection lost');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, data: { elements: [] } }));
      const mockClient = { send: mockSend, close: mockClose } as SaveClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await save('output', deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as SaveClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await save('output', deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
