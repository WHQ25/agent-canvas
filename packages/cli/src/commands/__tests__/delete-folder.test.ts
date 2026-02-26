import { describe, it, expect, vi, type Mock } from 'vitest';
import { deleteFolder, type DeleteFolderDeps, type DeleteFolderClient } from '../delete-folder';

function createMockClient(sendFn?: Mock): DeleteFolderClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true })),
    close: vi.fn(),
  } as DeleteFolderClient;
}

function createMockDeps(overrides?: Partial<DeleteFolderDeps>): DeleteFolderDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('deleteFolder', () => {
  describe('parameter assembly', () => {
    it('should send correct params with folder name', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteFolder({ name: 'My Folder' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'deleteFolder',
        id: 'test-id',
        params: { name: 'My Folder' },
      }));
    });
  });

  describe('response handling', () => {
    it('should log success message on success', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteFolder({ name: 'My Folder' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Folder "My Folder" deleted');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Folder not found',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteFolder({ name: 'Test' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Folder not found');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = { send: mockSend, close: mockClose } as DeleteFolderClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteFolder({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as DeleteFolderClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await deleteFolder({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
