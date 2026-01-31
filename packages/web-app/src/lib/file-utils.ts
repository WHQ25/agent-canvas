export interface FileReferenceElement {
  type?: string;
  fileId?: string;
  isDeleted?: boolean;
}

export interface BinaryFileData {
  id: string;
  mimeType: string;
  dataURL: string;
  created: number;
}

export function collectUsedFiles(
  elements: FileReferenceElement[],
  allFiles: Record<string, BinaryFileData>
): Record<string, BinaryFileData> {
  const usedFileIds = new Set<string>();
  for (const el of elements) {
    if (el.type === 'image' && el.fileId && !el.isDeleted) {
      usedFileIds.add(el.fileId);
    }
  }

  const files: Record<string, BinaryFileData> = {};
  for (const fileId of usedFileIds) {
    if (allFiles[fileId]) {
      files[fileId] = allFiles[fileId];
    }
  }

  return files;
}
