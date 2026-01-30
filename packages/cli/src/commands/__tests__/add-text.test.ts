import { describe, it, expect, vi, type Mock } from 'vitest';
import { addText, type AddTextDeps, type TextClient } from '../add-text';

function createMockClient(sendFn?: Mock): TextClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' })),
    close: vi.fn(),
  } as TextClient;
}

function createMockDeps(overrides?: Partial<AddTextDeps>): AddTextDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('addText', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with required options only', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addText({ text: 'Hello World', x: 100, y: 200 }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'addText',
        id: 'test-id',
        params: expect.objectContaining({
          text: 'Hello World',
          x: 100,
          y: 200,
        }),
      }));
      // customData should be undefined when no note
      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
    });

    it('should send correct optional params', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addText({
        text: 'Styled Text',
        x: 50,
        y: 60,
        fontSize: 24,
        textAlign: 'center',
        anchor: 'topLeft',
        strokeColor: '#ff0000',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.text).toBe('Styled Text');
      expect(callParams.x).toBe(50);
      expect(callParams.y).toBe(60);
      expect(callParams.fontSize).toBe(24);
      expect(callParams.textAlign).toBe('center');
      expect(callParams.anchor).toBe('topLeft');
      expect(callParams.strokeColor).toBe('#ff0000');
    });

    it('should set customData with note when note is provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addText({
        text: 'Text with note',
        x: 100,
        y: 100,
        note: 'my note',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toEqual({ note: 'my note' });
    });

    it('should not include customData when note is not provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addText({ text: 'No note', x: 0, y: 0 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with position and dimensions', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elementId: 'el-123',
        x: 100,
        y: 200,
        width: 150,
        height: 30,
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addText({ text: 'Test', x: 100, y: 200 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Text created (id: el-123, x: 100, y: 200, 150x30)');
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

      await addText({ text: 'Test', x: 0, y: 0 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Something went wrong');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = { send: mockSend, close: mockClose } as TextClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addText({ text: 'Test', x: 0, y: 0 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as TextClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addText({ text: 'Test', x: 0, y: 0 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
