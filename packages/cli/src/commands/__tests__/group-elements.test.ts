import { describe, it, expect, vi, type Mock } from 'vitest';
import { groupElements, type GroupElementsDeps, type GroupClient } from '../group-elements';

function createMockClient(sendFn?: Mock): GroupClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, groupId: 'group-1' })),
    close: vi.fn(),
  } as GroupClient;
}

function createMockDeps(overrides?: Partial<GroupElementsDeps>): GroupElementsDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('groupElements', () => {
  // ==================== Parameter Assembly Tests ====================
  describe('parameter assembly', () => {
    it('should send correct params with elementIds', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, groupId: 'group-1' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await groupElements({ elementIds: ['el-1', 'el-2', 'el-3'] }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'groupElements',
        id: 'test-id',
        params: {
          elementIds: ['el-1', 'el-2', 'el-3'],
        },
      }));
    });

    it('should handle single element', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, groupId: 'group-2' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await groupElements({ elementIds: ['el-single'] }, deps);

      const callParams = (mockSend as Mock).mock.calls[0][0].params;
      expect(callParams.elementIds).toEqual(['el-single']);
    });
  });

  // ==================== Response Handling Tests ====================
  describe('response handling', () => {
    it('should log success message with group ID', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, groupId: 'grp-abc123' }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await groupElements({ elementIds: ['el-1', 'el-2'] }, deps);

      expect(deps.log).toHaveBeenCalledWith('Group created (id: grp-abc123)');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Cannot group less than 2 elements',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await groupElements({ elementIds: ['el-1'] }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Cannot group less than 2 elements');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, groupId: 'group-1' }));
      const mockClient = { send: mockSend, close: mockClose } as GroupClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await groupElements({ elementIds: ['el-1', 'el-2'] }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as GroupClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await groupElements({ elementIds: ['el-1', 'el-2'] }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
