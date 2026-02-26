import { describe, it, expect, vi, type Mock } from 'vitest';
import { moveToFolder, type MoveToFolderDeps, type MoveToFolderClient } from '../move-to-folder';

function createMockClient(sendFn?: Mock): MoveToFolderClient {
  return {
    send: sendFn ?? vi.fn(() => Promise.resolve({ success: true })),
    close: vi.fn(),
  } as MoveToFolderClient;
}

function createMockDeps(overrides?: Partial<MoveToFolderDeps>): MoveToFolderDeps {
  return {
    connectToCanvas: vi.fn(() => Promise.resolve(createMockClient())),
    generateId: vi.fn(() => 'test-id'),
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
    ...overrides,
  };
}

describe('moveToFolder', () => {
  describe('parameter assembly', () => {
    it('should send correct params when moving to a folder', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveToFolder({ canvasName: 'My Canvas', folderName: 'My Folder' }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'moveCanvasToFolder',
        id: 'test-id',
        params: { canvasName: 'My Canvas', folderName: 'My Folder' },
      }));
    });

    it('should send null folderName when moving to ungrouped', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveToFolder({ canvasName: 'My Canvas', folderName: null }, deps);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        params: { canvasName: 'My Canvas', folderName: null },
      }));
    });
  });

  describe('response handling', () => {
    it('should log success message when moved to folder', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveToFolder({ canvasName: 'My Canvas', folderName: 'My Folder' }, deps);

      expect(deps.log).toHaveBeenCalledWith('Canvas "My Canvas" moved to folder "My Folder"');
    });

    it('should log ungrouped message when folderName is null', async () => {
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveToFolder({ canvasName: 'My Canvas', folderName: null }, deps);

      expect(deps.log).toHaveBeenCalledWith('Canvas "My Canvas" moved to ungrouped');
    });

    it('should error and exit on failure response', async () => {
      const mockSend = vi.fn(() => Promise.resolve({
        success: false,
        error: 'Canvas not found',
      }));
      const mockClient = createMockClient(mockSend);
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveToFolder({ canvasName: 'Test', folderName: 'Folder' }, deps);

      expect(deps.error).toHaveBeenCalledWith('Failed: Canvas not found');
      expect(deps.exit).toHaveBeenCalledWith(1);
    });

    it('should close client after success', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: true }));
      const mockClient = { send: mockSend, close: mockClose } as MoveToFolderClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveToFolder({ canvasName: 'Test', folderName: 'Folder' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close client after failure', async () => {
      const mockClose = vi.fn();
      const mockSend = vi.fn(() => Promise.resolve({ success: false, error: 'error' }));
      const mockClient = { send: mockSend, close: mockClose } as MoveToFolderClient;
      const deps = createMockDeps({
        connectToCanvas: vi.fn(() => Promise.resolve(mockClient)),
      });

      await moveToFolder({ canvasName: 'Test', folderName: 'Folder' }, deps);

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
