import { describe, it, expect } from 'vitest';
import { getMimeType, generateFileId, MAX_IMAGE_SIZE } from '../image-utils';

describe('getMimeType', () => {
  describe('supported extensions', () => {
    it('should return image/png for .png', () => {
      expect(getMimeType('test.png')).toBe('image/png');
    });

    it('should return image/jpeg for .jpg', () => {
      expect(getMimeType('test.jpg')).toBe('image/jpeg');
    });

    it('should return image/jpeg for .jpeg', () => {
      expect(getMimeType('test.jpeg')).toBe('image/jpeg');
    });

    it('should return image/gif for .gif', () => {
      expect(getMimeType('test.gif')).toBe('image/gif');
    });

    it('should return image/svg+xml for .svg', () => {
      expect(getMimeType('test.svg')).toBe('image/svg+xml');
    });

    it('should return image/webp for .webp', () => {
      expect(getMimeType('test.webp')).toBe('image/webp');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase .PNG', () => {
      expect(getMimeType('test.PNG')).toBe('image/png');
    });

    it('should handle uppercase .JPG', () => {
      expect(getMimeType('test.JPG')).toBe('image/jpeg');
    });

    it('should handle uppercase .JPEG', () => {
      expect(getMimeType('test.JPEG')).toBe('image/jpeg');
    });

    it('should handle uppercase .GIF', () => {
      expect(getMimeType('test.GIF')).toBe('image/gif');
    });

    it('should handle uppercase .SVG', () => {
      expect(getMimeType('test.SVG')).toBe('image/svg+xml');
    });

    it('should handle uppercase .WEBP', () => {
      expect(getMimeType('test.WEBP')).toBe('image/webp');
    });

    it('should handle mixed case .Png', () => {
      expect(getMimeType('test.Png')).toBe('image/png');
    });
  });

  describe('unsupported extensions', () => {
    it('should return null for .txt', () => {
      expect(getMimeType('test.txt')).toBeNull();
    });

    it('should return null for .bmp', () => {
      expect(getMimeType('test.bmp')).toBeNull();
    });

    it('should return null for .pdf', () => {
      expect(getMimeType('test.pdf')).toBeNull();
    });

    it('should return null for .doc', () => {
      expect(getMimeType('test.doc')).toBeNull();
    });
  });

  describe('no extension', () => {
    it('should return null for files without extension', () => {
      expect(getMimeType('testfile')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getMimeType('')).toBeNull();
    });

    it('should return null for path ending with dot', () => {
      expect(getMimeType('test.')).toBeNull();
    });
  });

  describe('paths with directories', () => {
    it('should handle full paths', () => {
      expect(getMimeType('/path/to/image.png')).toBe('image/png');
    });

    it('should handle relative paths', () => {
      expect(getMimeType('./images/photo.jpg')).toBe('image/jpeg');
    });
  });
});

describe('generateFileId', () => {
  it('should return a 40 character string (SHA-1 hex)', () => {
    const buffer = Buffer.from('test content');
    const fileId = generateFileId(buffer);
    expect(fileId.length).toBe(40);
  });

  it('should produce the same ID for the same content', () => {
    const content = 'identical content';
    const buffer1 = Buffer.from(content);
    const buffer2 = Buffer.from(content);
    expect(generateFileId(buffer1)).toBe(generateFileId(buffer2));
  });

  it('should produce different IDs for different content', () => {
    const buffer1 = Buffer.from('content A');
    const buffer2 = Buffer.from('content B');
    expect(generateFileId(buffer1)).not.toBe(generateFileId(buffer2));
  });

  it('should only contain hexadecimal characters [0-9a-f]', () => {
    const buffer = Buffer.from('any content here');
    const fileId = generateFileId(buffer);
    expect(fileId).toMatch(/^[0-9a-f]+$/);
  });

  it('should handle empty buffer', () => {
    const buffer = Buffer.from('');
    const fileId = generateFileId(buffer);
    expect(fileId.length).toBe(40);
    expect(fileId).toMatch(/^[0-9a-f]+$/);
  });

  it('should handle binary content', () => {
    const buffer = Buffer.from([0x00, 0xff, 0x80, 0x7f]);
    const fileId = generateFileId(buffer);
    expect(fileId.length).toBe(40);
    expect(fileId).toMatch(/^[0-9a-f]+$/);
  });
});

describe('MAX_IMAGE_SIZE', () => {
  it('should be 2MB (2 * 1024 * 1024)', () => {
    expect(MAX_IMAGE_SIZE).toBe(2 * 1024 * 1024);
  });

  it('should equal 2097152 bytes', () => {
    expect(MAX_IMAGE_SIZE).toBe(2097152);
  });
});
