import { createHash } from 'node:crypto';
import { extname } from 'node:path';

// Max image file size (2MB) - localStorage has ~5-10MB limit and Base64 adds ~33%
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

// Helper: Get MIME type from file extension
export function getMimeType(filepath: string): string | null {
  const ext = extname(filepath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || null;
}

// Helper: Generate FileId from file content (SHA-1 hash)
export function generateFileId(buffer: Buffer): string {
  return createHash('sha1').update(buffer).digest('hex');
}
