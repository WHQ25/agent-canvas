import { describe, it, expect, vi, type Mock } from 'vitest';
import { addArrow, parseViaPoints, type AddArrowDeps, type ArrowClient } from '../add-arrow';

function createMockClient(sendFn?: Mock): ArrowClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' })),
    close: vi.fn(),
  } as ArrowClient;
}

function createMockDeps(overrides?: Partial<AddArrowDeps>): AddArrowDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

// ==================== parseViaPoints Pure Function Tests ====================
describe('parseViaPoints', () => {
  it('should parse single point', () => {
    const result = parseViaPoints('100,200');
    expect(result).toEqual([{ x: 100, y: 200 }]);
  });

  it('should parse multiple points', () => {
    const result = parseViaPoints('100,200;300,400');
    expect(result).toEqual([{ x: 100, y: 200 }, { x: 300, y: 400 }]);
  });

  it('should parse three points', () => {
    const result = parseViaPoints('10,20;30,40;50,60');
    expect(result).toEqual([{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }]);
  });
});

describe('addArrow', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with required options only', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({ x: 100, y: 200, endX: 300, endY: 400 }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'addArrow',
        id: 'test-id',
        params: expect.objectContaining({
          x: 100,
          y: 200,
          endX: 300,
          endY: 400,
        }),
      }));
      // customData and midpoints should be undefined when not provided
      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toBeUndefined();
      expect(callParams.midpoints).toBeUndefined();
    });

    it('should send correct optional style params', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({
        x: 0,
        y: 0,
        endX: 100,
        endY: 100,
        strokeColor: '#ff0000',
        strokeWidth: 2,
        strokeStyle: 'dashed',
        startArrowhead: 'none',
        endArrowhead: 'triangle',
        arrowType: 'round',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.strokeColor).toBe('#ff0000');
      expect(callParams.strokeWidth).toBe(2);
      expect(callParams.strokeStyle).toBe('dashed');
      expect(callParams.startArrowhead).toBe('none');
      expect(callParams.endArrowhead).toBe('triangle');
      expect(callParams.arrowType).toBe('round');
    });

    it('should parse via into midpoints when provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({
        x: 0,
        y: 0,
        endX: 200,
        endY: 200,
        via: '100,50;150,150',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.midpoints).toEqual([{ x: 100, y: 50 }, { x: 150, y: 150 }]);
    });

    it('should have undefined midpoints when via is not provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.midpoints).toBeUndefined();
    });

    it('should set customData with note when note is provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({
        x: 0,
        y: 0,
        endX: 100,
        endY: 100,
        note: 'my arrow note',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.customData).toEqual({ note: 'my arrow note' });
    });

    it('should not include customData when note is not provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

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

      await addArrow({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(deps.log).toHaveBeenCalledWith('Arrow created (id: el-123)');
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

      await addArrow({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Something went wrong');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = { send: mockSend, close: mockClose } as ArrowClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as ArrowClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addArrow({ x: 0, y: 0, endX: 100, endY: 100 }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
