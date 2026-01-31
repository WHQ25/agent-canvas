import { describe, it, expect } from 'vitest';
import { collectUsedFiles, type BinaryFileData } from '../file-utils';

describe('collectUsedFiles', () => {
  it('should return empty object when no image elements', () => {
    const allFiles: Record<string, BinaryFileData> = {
      'file-1': { id: 'file-1', dataURL: 'data:image/png;base64,a', mimeType: 'image/png', created: 1 },
    };

    const result = collectUsedFiles([{ type: 'rectangle' }], allFiles);

    expect(result).toEqual({});
  });

  it('should include only files referenced by image elements', () => {
    const allFiles: Record<string, BinaryFileData> = {
      'file-1': { id: 'file-1', dataURL: 'data:image/png;base64,a', mimeType: 'image/png', created: 1 },
      'file-2': { id: 'file-2', dataURL: 'data:image/png;base64,b', mimeType: 'image/png', created: 2 },
    };

    const result = collectUsedFiles(
      [
        { type: 'image', fileId: 'file-1' },
        { type: 'image', fileId: 'missing' },
      ],
      allFiles
    );

    expect(result).toEqual({ 'file-1': allFiles['file-1'] });
  });

  it('should ignore deleted image elements', () => {
    const allFiles: Record<string, BinaryFileData> = {
      'file-1': { id: 'file-1', dataURL: 'data:image/png;base64,a', mimeType: 'image/png', created: 1 },
    };

    const result = collectUsedFiles([{ type: 'image', fileId: 'file-1', isDeleted: true }], allFiles);

    expect(result).toEqual({});
  });
});
