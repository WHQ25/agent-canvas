import { describe, it, expect, vi, type Mock } from 'vitest';
import { exportImage, type ExportDeps, type ExportClient } from '../export';

const SAMPLE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function createMockClient(sendFn?: Mock): ExportClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL })),
    close: vi.fn(),
  } as ExportClient;
}

function createMockDeps(overrides?: Partial<ExportDeps>): ExportDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    writeFile: vi.fn(),
    now: vi.fn(() => 1234567890),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('exportImage', () => {
  // ==================== Input Validation Tests ====================
  describe('input validation', () => {
    it('should error and exit when scale is not 1, 2, or 3', async () => {
      const deps = createMockDeps();

      await exportImage({ scale: 4 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Scale must be 1, 2, or 3');
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });

    it('should accept scale 1', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({ scale: 1 }, deps);

      expect(deps.error).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should accept scale 2', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({ scale: 2 }, deps);

      expect(deps.error).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should accept scale 3', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({ scale: 3 }, deps);

      expect(deps.error).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalled();
    });
  });

  // ==================== Parameter/Logic Tests ====================
  describe('parameter handling', () => {
    it('should send correct params with defaults', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({}, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'exportImage',
        id: 'test-id',
        params: {
          background: true,
          dark: false,
          embedScene: false,
          scale: 1,
        },
      }));
    });

    it('should send correct params with all options', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({
        background: false,
        dark: true,
        embedScene: true,
        scale: 2,
      }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        params: {
          background: false,
          dark: true,
          embedScene: true,
          scale: 2,
        },
      }));
    });

    it('should correctly parse dataUrl to buffer', async () => {
      const mockWriteFile = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        writeFile: mockWriteFile,
      });

      await exportImage({ output: 'test.png' }, deps);

      const expectedBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      expect(mockWriteFile).toHaveBeenCalledWith('test.png', expectedBuffer);
    });

    it('should generate default filename when output not specified', async () => {
      const mockWriteFile = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        writeFile: mockWriteFile,
        now: vi.fn(() => 1234567890),
      });

      await exportImage({}, deps);

      expect(mockWriteFile).toHaveBeenCalledWith('canvas-1234567890.png', expect.any(Buffer));
      expect(deps.log).toHaveBeenCalledWith('Exported to canvas-1234567890.png');
    });

    it('should use provided output path', async () => {
      const mockWriteFile = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
        writeFile: mockWriteFile,
      });

      await exportImage({ output: 'my-diagram.png' }, deps);

      expect(mockWriteFile).toHaveBeenCalledWith('my-diagram.png', expect.any(Buffer));
      expect(deps.log).toHaveBeenCalledWith('Exported to my-diagram.png');
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message on success', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({ output: 'output.png' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Exported to output.png');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Export failed',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({}, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Export failed');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, dataUrl: SAMPLE_DATA_URL }));
      const mockClient = { send: mockSend, close: mockClose } as ExportClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({}, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ExportClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await exportImage({}, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
