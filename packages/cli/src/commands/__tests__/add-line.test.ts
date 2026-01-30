import { describe, it, expect, vi, type Mock } from 'vitest';
import { addLine, type AddLineDeps, type LineClient } from '../add-line';

function createMockClient(sendFn?: Mock): LineClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' })),
    close: vi.fn(),
  } as LineClient;
}

function createMockDeps(overrides?: Partial<AddLineDeps>): AddLineDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('addLine', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with required options only', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addLine({ x: 100, y: 200, endX: 300, endY: 400 }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'addLine',
        id: 'test-id',
        params: expect.objectContaining({
          x: 100,
          y: 200,
          endX: 300,
          endY: 400,
        }),
      }));
      // customData should be undefined when no note
      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
    });

    it('should send correct optional style params', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addLine({
        x: 0,
        y: 0,
        endX: 100,
        endY: 100,
        strokeColor: '#ff0000',
        strokeWidth: 2,
        strokeStyle: 'dashed',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.strokeColor).toBe('#ff0000');
      expect(callParams.strokeWidth).toBe(2);
      expect(callParams.strokeStyle).toBe('dashed');
    });

    it('should set customData with note when note is provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addLine({
        x: 0,
        y: 0,
        endX: 100,
        endY: 100,
        note: 'my line note',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toEqual({ note: 'my line note' });
    });

    it('should not include customData when note is not provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addLine({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with element id', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        elementId: 'el-123',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addLine({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Line created (id: el-123)');
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

      await addLine({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Something went wrong');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = { send: mockSend, close: mockClose } as LineClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addLine({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as LineClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addLine({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
