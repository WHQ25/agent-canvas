import { describe, it, expect, vi, type Mock } from 'vitest';
import { addPolygon, type AddPolygonDeps, type PolygonClient } from '../add-polygon';

function createMockClient(sendFn?: Mock): PolygonClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' })),
    close: vi.fn(),
  } as PolygonClient;
}

function createMockDeps(overrides?: Partial<AddPolygonDeps>): AddPolygonDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('addPolygon', () => {
  // ==================== Input Validation Tests ====================
  describe('input validation', () => {
    it('should error and exit when points JSON is invalid', async () => {
      const deps = createMockDeps();

      await addPolygon({ points: 'not-valid-json' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Invalid points JSON');
      expect(deps.exit).toHaveBeenCalledWith(1);
      // WebSocket should not be called
      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });

    it('should not connect to WebSocket when JSON parsing fails', async () => {
      const deps = createMockDeps();

      await addPolygon({ points: '{invalid' }, deps);

      expect(deps.connectToCanvas).not.toHaveBeenCalled();
    });
  });

  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should parse and send points correctly', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      const pointsJson = '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]';
      await addPolygon({ points: pointsJson }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'addPolygon',
        id: 'test-id',
        params: expect.objectContaining({
          points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }],
        }),
      }));
    });

    it('should send correct style params', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addPolygon({
        points: '[{"x":0,"y":0},{"x":100,"y":0}]',
        strokeColor: '#ff0000',
        backgroundColor: '#00ff00',
        strokeWidth: 2,
        strokeStyle: 'dashed',
        fillStyle: 'solid',
      }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.strokeColor).toBe('#ff0000');
      expect(callParams.backgroundColor).toBe('#00ff00');
      expect(callParams.strokeWidth).toBe(2);
      expect(callParams.strokeStyle).toBe('dashed');
      expect(callParams.fillStyle).toBe('solid');
    });

    it('should set customData with note when note is provided', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addPolygon({
        points: '[{"x":0,"y":0},{"x":100,"y":0}]',
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

      await addPolygon({ points: '[{"x":0,"y":0}]' }, deps);

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

      await addPolygon({ points: '[{"x":0,"y":0}]' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Polygon created (id: el-123)');
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

      await addPolygon({ points: '[{"x":0,"y":0}]' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Something went wrong');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, elementId: 'el-1' }));
      const mockClient = { send: mockSend, close: mockClose } as PolygonClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addPolygon({ points: '[{"x":0,"y":0}]' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as PolygonClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await addPolygon({ points: '[{"x":0,"y":0}]' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
