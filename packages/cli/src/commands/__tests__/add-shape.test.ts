import { describe, it, expect, vi, type Mock } from 'vitest';
import { addShape, type AddShapeDeps, type ShapeClient } from '../add-shape';

function createMockClient(sendFn?: Mock): ShapeClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' })),
    close: vi.fn(),
  } as ShapeClient;
}

function createMockDeps(overrides?: Partial<AddShapeDeps>): AddShapeDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('addShape', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with required options only', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({ type: 'rectangle', x: 100, y: 200 }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'addShape',
        id: 'test-id',
        params: expect.objectContaining({
          type: 'rectangle',
          x: 100,
          y: 200,
        }),
      }));
      // customData should be undefined when no note
      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
      // label should be undefined when no label
      expect(callParams.label).toBeUndefined();
    });

    it('should send correct style params', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({
        type: 'ellipse',
        x: 50,
        y: 60,
        width: 200,
        height: 100,
        strokeColor: '#ff0000',
        backgroundColor: '#00ff00',
        strokeWidth: 2,
        strokeStyle: 'dashed',
        fillStyle: 'solid',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.type).toBe('ellipse');
      expect(callParams.x).toBe(50);
      expect(callParams.y).toBe(60);
      expect(callParams.width).toBe(200);
      expect(callParams.height).toBe(100);
      expect(callParams.strokeColor).toBe('#ff0000');
      expect(callParams.backgroundColor).toBe('#00ff00');
      expect(callParams.strokeWidth).toBe(2);
      expect(callParams.strokeStyle).toBe('dashed');
      expect(callParams.fillStyle).toBe('solid');
    });

    it('should set label with text and fontSize when label is provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({
        type: 'rectangle',
        x: 100,
        y: 100,
        label: 'Hello World',
        labelFontSize: 24,
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.label).toEqual({ text: 'Hello World', fontSize: 24 });
    });

    it('should set label without fontSize when labelFontSize is not provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({
        type: 'diamond',
        x: 100,
        y: 100,
        label: 'No font size',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.label).toEqual({ text: 'No font size', fontSize: undefined });
    });

    it('should not include label field when label is not provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({ type: 'rectangle', x: 0, y: 0 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.label).toBeUndefined();
    });

    it('should set customData with note when note is provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({
        type: 'rectangle',
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

      await addShape({ type: 'rectangle', x: 0, y: 0 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with dimensions when provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elementId: 'el-123',
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({ type: 'rectangle', x: 100, y: 200 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Shape created (id: el-123 x=100 y=200 w=300 h=400)');
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

      await addShape({ type: 'rectangle', x: 0, y: 0 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Something went wrong');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = { send: mockSend, close: mockClose } as ShapeClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({ type: 'rectangle', x: 0, y: 0 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ShapeClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addShape({ type: 'rectangle', x: 0, y: 0 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
