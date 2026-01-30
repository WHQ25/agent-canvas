import { describe, it, expect, vi, type Mock } from 'vitest';
import { addImage, type AddImageDeps, type ImageClient } from '../add-image';

function createMockClient(sendFn?: Mock): ImageClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1', fileId: 'file-1' })),
    close: vi.fn(),
  } as ImageClient;
}

function createMockDeps(overrides?: Partial<AddImageDeps>): AddImageDeps {
  return {
    readFile: vi.fn(() => Buffer.from('fake-image-data')),
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('addImage', () => {
  // ==================== Input Validation Tests ====================
  describe('input validation', () => {
    it('should error on unsupported image format', async () => {
      const deps = createMockDeps();
      await addImage({ file: 'test.txt', x: 0, y: 0 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Unsupported image format. Supported: PNG, JPEG, GIF, SVG, WebP');
      expect(deps.exit).toHaveBeenCalledWith(1);
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });

    it('should error when file does not exist', async () => {
      const deps = createMockDeps({
        readFile: vi.fn(() => { throw new Error('ENOENT'); }),
      });
      await addImage({ file: 'missing.png', x: 0, y: 0 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed to read file: missing.png');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should error when file is too large', async () => {
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
      const deps = createMockDeps({
        readFile: vi.fn(() => largeBuffer),
      });
      await addImage({ file: 'large.png', x: 0, y: 0 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Image too large: 3.00MB (max: 2MB)');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });
  });

  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with required options only', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1', fileId: 'file-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({ file: 'test.png', x: 100, y: 200 }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'addImage',
        params: expect.objectContaining({
          x: 100,
          y: 200,
          mimeType: 'image/png',
        }),
      }));
      // customData should be undefined when no note
      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
    });

    it('should send correct params with all options', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1', fileId: 'file-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({
        file: 'test.jpg',
        x: 100,
        y: 200,
        width: 300,
        height: 400,
        note: 'test note',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.x).toBe(100);
      expect(callParams.y).toBe(200);
      expect(callParams.width).toBe(300);
      expect(callParams.height).toBe(400);
      expect(callParams.mimeType).toBe('image/jpeg');
      expect(callParams.customData).toEqual({ note: 'test note' });
    });

    it('should generate correct dataUrl format', async () => {
      const testData = Buffer.from('test-image-content');
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1', fileId: 'file-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        readFile: vi.fn(() => testData),
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({ file: 'test.png', x: 0, y: 0 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.dataUrl).toBe(`data:image/png;base64,${testData.toString('base64')}`);
    });

    it('should generate fileId from buffer content', async () => {
      const testData = Buffer.from('unique-content');
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1', fileId: 'file-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        readFile: vi.fn(() => testData),
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({ file: 'test.png', x: 0, y: 0 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      // fileId should be 40 char SHA-1 hash
      expect(callParams.fileId).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with dimensions when provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elementId: 'el-123',
        fileId: 'file-456',
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({ file: 'test.png', x: 100, y: 200 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Image added (id: el-123, fileId: file-456 x=100 y=200 w=300 h=400)');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Something went wrong',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({ file: 'test.png', x: 0, y: 0 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Something went wrong');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1', fileId: 'file-1' }));
      const mockClient = { send: mockSend, close: mockClose } as ImageClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({ file: 'test.png', x: 0, y: 0 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ImageClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addImage({ file: 'test.png', x: 0, y: 0 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
