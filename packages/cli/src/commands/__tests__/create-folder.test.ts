import { describe, it, expect, vi, type Mock } from 'vitest';
import { createFolder, type CreateFolderDeps, type CreateFolderClient } from '../create-folder';

function createMockClient(sendFn?: Mock): CreateFolderClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true, category: { id: 'cat-1', name: 'Test', isCollapsed: false, order: 0 } })),
    close: vi.fn(),
  } as CreateFolderClient;
}

function createMockDeps(overrides?: Partial<CreateFolderDeps>): CreateFolderDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('createFolder', () => {
  describe('parameter assembly', () => {
    it('should send correct params with folder name', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true, category: { id: 'cat-1', name: 'My Folder', isCollapsed: false, order: 0 } }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await createFolder({ name: 'My Folder' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'createFolder',
        id: 'test-id',
        params: { name: 'My Folder' },
      }));
    });
  });

  describe('response handling', () => {
    it('should log success message on success', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: true,
        category: { id: 'cat-1', name: 'My Folder', isCollapsed: false, order: 0 },
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await createFolder({ name: 'My Folder' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Folder "My Folder" created');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Folder already exists',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await createFolder({ name: 'Test' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Folder already exists');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true, category: { id: 'cat-1', name: 'Test', isCollapsed: false, order: 0 } }));
      const mockClient = { send: mockSend, close: mockClose } as CreateFolderClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await createFolder({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as CreateFolderClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await createFolder({ name: 'Test' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
