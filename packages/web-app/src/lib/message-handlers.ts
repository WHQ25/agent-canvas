/**
 * Message handlers extracted from App.tsx for better testability.
 * Uses dependency injection pattern for Excalidraw API and storage.
 */

import { convertToExcalidrawElements, restoreElements } from '@excalidraw/excalidraw';
import type {
  HandlerDeps,
  HandlerContext,
  ExcalidrawElement,
  BinaryFileData,
  CanvasSceneData,
} from './handler-types';
import type {
  AddShapeParams,
  AddTextParams,
  AddLineParams,
  AddArrowParams,
  AddPolygonParams,
  AddImageParams,
  DeleteElementsParams,
  RotateElementsParams,
  GroupElementsParams,
  UngroupElementParams,
  MoveElementsParams,
  ResizeElementsParams,
  LoadSceneParams,
  ExportImageParams,
  SceneElement,
} from '../protocol';

// ExportToBlob type for dependency injection
export type ExportToBlobFn = (opts: {
  elements: unknown[];
  files: unknown;
  appState: {
    exportBackground: boolean;
    exportEmbedScene: boolean;
    exportWithDarkMode: boolean;
  };
  getDimensions: (width: number, height: number) => { width: number; height: number; scale: number };
}) => Promise<Blob>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format error to string
 */
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Get elements from API or storage based on context
 */
export async function getElements(
  ctx: HandlerContext,
  deps: HandlerDeps
): Promise<{ elements: readonly ExcalidrawElement[]; scene: CanvasSceneData | null }> {
  if (ctx.useDirectStorage) {
    const scene = await deps.storage.loadCanvasScene(ctx.canvasId);
    return { elements: (scene?.elements || []) as ExcalidrawElement[], scene };
  }
  return { elements: ctx.api.getSceneElements(), scene: null };
}

/**
 * Save elements to API or storage based on context
 */
export async function saveElements(
  ctx: HandlerContext,
  deps: HandlerDeps,
  elements: unknown[],
  files?: unknown
): Promise<void> {
  if (ctx.useDirectStorage) {
    await deps.saveAndSync(ctx.canvasId, elements, files);
  } else {
    ctx.api.updateScene({
      elements: elements as readonly unknown[],
      captureUpdate: deps.CaptureUpdateAction.IMMEDIATELY,
    });
  }
}

/**
 * Add new elements to canvas (appends to existing elements)
 */
export async function addElementsToCanvas(
  ctx: HandlerContext,
  deps: HandlerDeps,
  newElements: unknown[],
  files?: unknown
): Promise<void> {
  const { elements: existingElements, scene } = await getElements(ctx, deps);
  const updatedElements = [...existingElements, ...newElements];
  await saveElements(ctx, deps, updatedElements, files ?? scene?.files);
}

// ============================================================================
// Add Shape Handler
// ============================================================================

export interface AddShapeResult {
  type: 'addShapeResult';
  id: string;
  success: boolean;
  elementId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  error?: string;
}

export async function handleAddShape(
  deps: HandlerDeps,
  id: string,
  params: AddShapeParams
): Promise<AddShapeResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'addShapeResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapeSkeleton: any = {
      type: params.type,
      x: params.x,
      y: params.y,
      strokeColor: params.strokeColor ?? '#1e1e1e',
      backgroundColor: params.backgroundColor ?? 'transparent',
      strokeWidth: params.strokeWidth ?? 2,
      strokeStyle: params.strokeStyle ?? 'solid',
      fillStyle: params.fillStyle ?? 'solid',
      customData: params.customData,
    };

    if (params.width !== undefined) shapeSkeleton.width = params.width;
    if (params.height !== undefined) shapeSkeleton.height = params.height;

    if (params.label) {
      shapeSkeleton.label = {
        text: params.label.text.replace(/\\n/g, '\n'),
        fontSize: params.label.fontSize ?? 16,
        textAlign: params.label.textAlign ?? 'center',
        verticalAlign: params.label.verticalAlign ?? 'middle',
        strokeColor: params.label.strokeColor,
      };
    }

    const newElements = convertToExcalidrawElements([shapeSkeleton]);
    const elementsToAdd = params.customData
      ? newElements.map(el => ({ ...el, customData: params.customData }))
      : newElements;

    await addElementsToCanvas(ctx, deps, elementsToAdd);

    // Get the added element to return its actual dimensions
    const addedElement = ctx.useDirectStorage
      ? elementsToAdd[0] as unknown as ExcalidrawElement
      : ctx.api.getSceneElements().find(e => e.id === newElements[0].id);

    return {
      type: 'addShapeResult',
      id,
      success: true,
      elementId: newElements[0].id,
      x: Math.round(addedElement?.x ?? params.x),
      y: Math.round(addedElement?.y ?? params.y),
      width: addedElement?.width !== undefined ? Math.round(addedElement.width) : undefined,
      height: addedElement?.height !== undefined ? Math.round(addedElement.height) : undefined,
    };
  } catch (error) {
    return { type: 'addShapeResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Add Text Handler
// ============================================================================

export interface AddTextResult {
  type: 'addTextResult';
  id: string;
  success: boolean;
  elementId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  error?: string;
}

export async function handleAddText(
  deps: HandlerDeps,
  id: string,
  params: AddTextParams
): Promise<AddTextResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'addTextResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textSkeleton: any = {
      type: 'text',
      text: params.text.replace(/\\n/g, '\n'),
      x: 0,
      y: 0,
      fontSize: params.fontSize ?? 20,
      textAlign: params.textAlign ?? 'left',
      strokeColor: params.strokeColor ?? '#1e1e1e',
      customData: params.customData,
    };

    const newElements = convertToExcalidrawElements([textSkeleton]);
    const textElement = newElements[0] as unknown as ExcalidrawElement;
    const width = textElement.width ?? 0;
    const height = textElement.height ?? 0;

    // Calculate offset based on anchor point
    const anchor = params.anchor ?? 'bottomLeft';
    let offsetX = 0;
    let offsetY = 0;

    if (anchor === 'topCenter' || anchor === 'center' || anchor === 'bottomCenter') {
      offsetX = -width / 2;
    } else if (anchor === 'topRight' || anchor === 'rightCenter' || anchor === 'bottomRight') {
      offsetX = -width;
    }

    if (anchor === 'leftCenter' || anchor === 'center' || anchor === 'rightCenter') {
      offsetY = -height / 2;
    } else if (anchor === 'bottomLeft' || anchor === 'bottomCenter' || anchor === 'bottomRight') {
      offsetY = -height;
    }

    const finalX = params.x + offsetX;
    const finalY = params.y + offsetY;

    const elementsToAdd = newElements.map(el => ({
      ...el,
      x: finalX,
      y: finalY,
      customData: params.customData,
    }));

    await addElementsToCanvas(ctx, deps, elementsToAdd);

    return {
      type: 'addTextResult',
      id,
      success: true,
      elementId: textElement.id,
      x: Math.round(finalX),
      y: Math.round(finalY),
      width: Math.round(width),
      height: Math.round(height),
    };
  } catch (error) {
    return { type: 'addTextResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Add Line Handler
// ============================================================================

export interface AddLineResult {
  type: 'addLineResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

export async function handleAddLine(
  deps: HandlerDeps,
  id: string,
  params: AddLineParams
): Promise<AddLineResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'addLineResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineSkeleton: any = {
      type: 'line',
      x: params.x,
      y: params.y,
      points: [[0, 0], [params.endX - params.x, params.endY - params.y]],
      strokeColor: params.strokeColor ?? '#1e1e1e',
      strokeWidth: params.strokeWidth ?? 2,
      strokeStyle: params.strokeStyle ?? 'solid',
      customData: params.customData,
    };

    const newElements = convertToExcalidrawElements([lineSkeleton]);
    const elementsToAdd = params.customData
      ? newElements.map(el => ({ ...el, customData: params.customData }))
      : newElements;

    await addElementsToCanvas(ctx, deps, elementsToAdd);

    return { type: 'addLineResult', id, success: true, elementId: newElements[0].id };
  } catch (error) {
    return { type: 'addLineResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Add Arrow Handler
// ============================================================================

export interface AddArrowResult {
  type: 'addArrowResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

export async function handleAddArrow(
  deps: HandlerDeps,
  id: string,
  params: AddArrowParams
): Promise<AddArrowResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'addArrowResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const dx = params.endX - params.x;
    const dy = params.endY - params.y;

    // Calculate points based on arrow type
    let points: number[][];
    if (params.arrowType === 'round') {
      if (params.midpoints && params.midpoints.length > 0) {
        const mid = params.midpoints[0];
        points = [[0, 0], [mid.x - params.x, mid.y - params.y], [dx, dy]];
      } else {
        points = [[0, 0], [dx / 2, dy / 2], [dx, dy]];
      }
    } else if (params.arrowType === 'elbow') {
      if (params.midpoints && params.midpoints.length > 0) {
        points = [[0, 0], ...params.midpoints.map(pt => [pt.x - params.x, pt.y - params.y]), [dx, dy]];
      } else {
        points = [[0, 0], [dx, 0], [dx, dy]];
      }
    } else {
      points = [[0, 0], [dx, dy]];
    }

    // Convert 'none' to null for arrowheads (Excalidraw uses null, not 'none')
    const startArrowhead = params.startArrowhead === 'none' ? null : (params.startArrowhead ?? null);
    const endArrowhead = params.endArrowhead === 'none' ? null : (params.endArrowhead ?? 'arrow');

    // Common arrow properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseArrowProps: any = {
      type: 'arrow',
      x: params.x,
      y: params.y,
      points,
      strokeColor: params.strokeColor ?? '#1e1e1e',
      strokeWidth: params.strokeWidth ?? 2,
      strokeStyle: params.strokeStyle ?? 'solid',
      startArrowhead,
      endArrowhead,
      customData: params.customData,
    };

    // For elbow/round arrows, use restoreElements for proper initialization
    if (params.arrowType === 'elbow' || params.arrowType === 'round') {
      const arrowId = Math.random().toString(36).substring(2, 15);
      const allX = points.map(p => p[0]);
      const allY = points.map(p => p[1]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawArrow: any = {
        ...baseArrowProps,
        id: arrowId,
        width: Math.max(...allX) - Math.min(...allX) || Math.abs(dx),
        height: Math.max(...allY) - Math.min(...allY) || Math.abs(dy),
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        roundness: params.arrowType === 'round' ? { type: 2 } : null,
        elbowed: params.arrowType === 'elbow',
        ...(params.arrowType === 'elbow' && {
          fixedSegments: [],
          startIsSpecial: false,
          endIsSpecial: false,
        }),
      };

      const restoredElements = restoreElements([rawArrow], null);
      await addElementsToCanvas(ctx, deps, restoredElements);

      return { type: 'addArrowResult', id, success: true, elementId: arrowId };
    }

    // For sharp arrows, use convertToExcalidrawElements
    const newElements = convertToExcalidrawElements([baseArrowProps]);
    const elementsToAdd = params.customData
      ? newElements.map(el => ({ ...el, customData: params.customData }))
      : newElements;

    await addElementsToCanvas(ctx, deps, elementsToAdd);

    return { type: 'addArrowResult', id, success: true, elementId: newElements[0].id };
  } catch (error) {
    return { type: 'addArrowResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Add Polygon Handler
// ============================================================================

export interface AddPolygonResult {
  type: 'addPolygonResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

export async function handleAddPolygon(
  deps: HandlerDeps,
  id: string,
  params: AddPolygonParams
): Promise<AddPolygonResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'addPolygonResult', id, success: false, error: 'Canvas not available' };
  }

  if (params.points.length < 3) {
    return { type: 'addPolygonResult', id, success: false, error: 'Polygon requires at least 3 points' };
  }

  try {
    const firstPoint = params.points[0];
    const points = [...params.points.map(p => [p.x - firstPoint.x, p.y - firstPoint.y]), [0, 0]];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const polygonSkeleton: any = {
      type: 'line',
      x: firstPoint.x,
      y: firstPoint.y,
      points,
      strokeColor: params.strokeColor ?? '#1e1e1e',
      backgroundColor: params.backgroundColor ?? 'transparent',
      strokeWidth: params.strokeWidth ?? 2,
      strokeStyle: params.strokeStyle ?? 'solid',
      fillStyle: params.fillStyle ?? 'solid',
      customData: params.customData,
    };

    const newElements = convertToExcalidrawElements([polygonSkeleton]);
    const elementsToAdd = params.customData
      ? newElements.map(el => ({ ...el, customData: params.customData }))
      : newElements;

    await addElementsToCanvas(ctx, deps, elementsToAdd);

    return { type: 'addPolygonResult', id, success: true, elementId: newElements[0].id };
  } catch (error) {
    return { type: 'addPolygonResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Add Image Handler
// ============================================================================

export interface AddImageResult {
  type: 'addImageResult';
  id: string;
  success: boolean;
  elementId?: string;
  fileId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  error?: string;
}

export async function handleAddImage(
  deps: HandlerDeps,
  id: string,
  params: AddImageParams
): Promise<AddImageResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'addImageResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    // Get image dimensions if not provided
    let width = params.width;
    let height = params.height;

    if (width === undefined || height === undefined) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = params.dataUrl;
      });

      if (width === undefined && height === undefined) {
        width = img.naturalWidth;
        height = img.naturalHeight;
      } else if (width === undefined) {
        width = (height! / img.naturalHeight) * img.naturalWidth;
      } else {
        height = (width / img.naturalWidth) * img.naturalHeight;
      }
    }

    const elementId = Math.random().toString(36).substring(2, 15);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageElement: any = {
      id: elementId,
      type: 'image',
      x: params.x,
      y: params.y,
      width,
      height,
      fileId: params.fileId,
      status: 'saved',
      scale: [1, 1],
      crop: null,
      strokeColor: 'transparent',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      angle: 0,
      groupIds: [],
      frameId: null,
      index: null,
      roundness: null,
      boundElements: null,
      link: null,
      locked: false,
      customData: params.customData,
      seed: Math.floor(Math.random() * 2147483647),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2147483647),
      isDeleted: false,
      updated: Date.now(),
    };

    const fileData: BinaryFileData = {
      mimeType: params.mimeType,
      id: params.fileId,
      dataURL: params.dataUrl,
      created: Date.now(),
    };

    if (ctx.useDirectStorage) {
      const { elements: existingElements, scene } = await getElements(ctx, deps);
      const existingFiles = (scene?.files || {}) as Record<string, BinaryFileData>;
      await deps.saveAndSync(ctx.canvasId, [...existingElements, imageElement], { ...existingFiles, [params.fileId]: fileData });
    } else {
      ctx.api.addFiles([fileData]);
      const elements = ctx.api.getSceneElements();
      ctx.api.updateScene({
        elements: [...elements, imageElement],
        captureUpdate: deps.CaptureUpdateAction.IMMEDIATELY,
      });
    }

    return {
      type: 'addImageResult',
      id,
      success: true,
      elementId,
      fileId: params.fileId,
      x: Math.round(params.x),
      y: Math.round(params.y),
      width: Math.round(width!),
      height: Math.round(height!),
    };
  } catch (error) {
    return { type: 'addImageResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Delete Elements Handler
// ============================================================================

export interface DeleteElementsResult {
  type: 'deleteElementsResult';
  id: string;
  success: boolean;
  deletedCount?: number;
  error?: string;
}

export async function handleDeleteElements(
  deps: HandlerDeps,
  id: string,
  params: DeleteElementsParams
): Promise<DeleteElementsResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'deleteElementsResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const { elements, scene } = await getElements(ctx, deps);

    // Collect IDs to delete, including bound elements
    const idsToDelete = new Set(params.elementIds);
    for (const el of elements) {
      if (idsToDelete.has(el.id) && el.boundElements) {
        el.boundElements.forEach(bound => idsToDelete.add(bound.id));
      }
    }

    let deletedCount = 0;
    const updatedElements = elements.map(e => {
      if (idsToDelete.has(e.id)) {
        deletedCount++;
        return {
          ...e,
          isDeleted: true,
          version: (e.version ?? 0) + 1,
          versionNonce: Math.floor(Math.random() * 2147483647),
        };
      }
      return e;
    });

    if (deletedCount === 0) {
      return { type: 'deleteElementsResult', id, success: false, error: 'No elements found' };
    }

    await saveElements(ctx, deps, updatedElements as unknown[], scene?.files);

    return { type: 'deleteElementsResult', id, success: true, deletedCount };
  } catch (error) {
    return { type: 'deleteElementsResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Rotate Elements Handler
// ============================================================================

export interface RotateElementsResult {
  type: 'rotateElementsResult';
  id: string;
  success: boolean;
  rotatedCount?: number;
  error?: string;
}

export async function handleRotateElements(
  deps: HandlerDeps,
  id: string,
  params: RotateElementsParams
): Promise<RotateElementsResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'rotateElementsResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const { elements, scene } = await getElements(ctx, deps);

    const idsToRotate = new Set(params.elementIds);
    const angleInRadians = (params.angle * Math.PI) / 180;

    // Collect group IDs from elements being rotated
    const groupIds = new Set<string>();
    for (const e of elements) {
      if (idsToRotate.has(e.id) && e.groupIds?.length) {
        e.groupIds.forEach(gid => groupIds.add(gid));
      }
    }

    // Track bound text elements that need rotation
    const boundTextAngles = new Map<string, number>();
    for (const e of elements) {
      const shouldRotate = idsToRotate.has(e.id) ||
        (groupIds.size > 0 && e.groupIds?.some(gid => groupIds.has(gid)));
      if (shouldRotate && e.boundElements) {
        const newAngle = (e.angle ?? 0) + angleInRadians;
        for (const bound of e.boundElements) {
          if (bound.type === 'text') {
            boundTextAngles.set(bound.id, newAngle);
          }
        }
      }
    }

    let rotatedCount = 0;
    const updatedElements = elements.map(e => {
      // Handle bound text elements
      if (boundTextAngles.has(e.id)) {
        return {
          ...e,
          angle: boundTextAngles.get(e.id),
          version: (e.version ?? 0) + 1,
          versionNonce: Math.floor(Math.random() * 2147483647),
        };
      }

      const shouldRotate = idsToRotate.has(e.id) ||
        (groupIds.size > 0 && e.groupIds?.some(gid => groupIds.has(gid)));

      if (shouldRotate) {
        rotatedCount++;
        return {
          ...e,
          angle: (e.angle ?? 0) + angleInRadians,
          version: (e.version ?? 0) + 1,
          versionNonce: Math.floor(Math.random() * 2147483647),
        };
      }
      return e;
    });

    if (rotatedCount === 0) {
      return { type: 'rotateElementsResult', id, success: false, error: 'No elements found' };
    }

    await saveElements(ctx, deps, updatedElements as unknown[], scene?.files);

    return { type: 'rotateElementsResult', id, success: true, rotatedCount };
  } catch (error) {
    return { type: 'rotateElementsResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Group Elements Handler
// ============================================================================

export interface GroupElementsResult {
  type: 'groupElementsResult';
  id: string;
  success: boolean;
  groupId?: string;
  error?: string;
}

export async function handleGroupElements(
  deps: HandlerDeps,
  id: string,
  params: GroupElementsParams
): Promise<GroupElementsResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'groupElementsResult', id, success: false, error: 'Canvas not available' };
  }

  if (params.elementIds.length < 2) {
    return { type: 'groupElementsResult', id, success: false, error: 'At least 2 elements required for grouping' };
  }

  try {
    const { elements, scene } = await getElements(ctx, deps);
    const newGroupId = Math.random().toString(36).substring(2, 15);
    const idsToGroup = new Set(params.elementIds);

    const updatedElements = elements.map(e => {
      if (idsToGroup.has(e.id)) {
        return {
          ...e,
          groupIds: [...(e.groupIds ?? []), newGroupId],
          version: (e.version ?? 0) + 1,
          versionNonce: Math.floor(Math.random() * 2147483647),
        };
      }
      return e;
    });

    await saveElements(ctx, deps, updatedElements as unknown[], scene?.files);

    return { type: 'groupElementsResult', id, success: true, groupId: newGroupId };
  } catch (error) {
    return { type: 'groupElementsResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Ungroup Element Handler
// ============================================================================

export interface UngroupElementResult {
  type: 'ungroupElementResult';
  id: string;
  success: boolean;
  error?: string;
}

export async function handleUngroupElement(
  deps: HandlerDeps,
  id: string,
  params: UngroupElementParams
): Promise<UngroupElementResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'ungroupElementResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const { elements, scene } = await getElements(ctx, deps);
    const element = elements.find(e => e.id === params.elementId);

    if (!element) {
      return { type: 'ungroupElementResult', id, success: false, error: 'Element not found' };
    }
    if (!element.groupIds?.length) {
      return { type: 'ungroupElementResult', id, success: false, error: 'Element is not in any group' };
    }

    const updatedElements = elements.map(e => {
      if (e.id === params.elementId) {
        return {
          ...e,
          groupIds: e.groupIds?.slice(0, -1) ?? [],
          version: (e.version ?? 0) + 1,
          versionNonce: Math.floor(Math.random() * 2147483647),
        };
      }
      return e;
    });

    await saveElements(ctx, deps, updatedElements as unknown[], scene?.files);

    return { type: 'ungroupElementResult', id, success: true };
  } catch (error) {
    return { type: 'ungroupElementResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Move Elements Handler
// ============================================================================

export interface MoveElementsResult {
  type: 'moveElementsResult';
  id: string;
  success: boolean;
  movedCount?: number;
  error?: string;
}

export async function handleMoveElements(
  deps: HandlerDeps,
  id: string,
  params: MoveElementsParams
): Promise<MoveElementsResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'moveElementsResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const { elements, scene } = await getElements(ctx, deps);

    // Collect IDs to move, including bound elements
    const idsToMove = new Set(params.elementIds);
    for (const el of elements) {
      if (idsToMove.has(el.id) && el.boundElements) {
        el.boundElements.forEach(bound => idsToMove.add(bound.id));
      }
    }

    // Collect group IDs from elements being moved
    const groupIds = new Set<string>();
    for (const e of elements) {
      if (idsToMove.has(e.id) && e.groupIds?.length) {
        e.groupIds.forEach(gid => groupIds.add(gid));
      }
    }

    let movedCount = 0;
    const updatedElements = elements.map(e => {
      const shouldMove = idsToMove.has(e.id) ||
        (groupIds.size > 0 && e.groupIds?.some(gid => groupIds.has(gid)));

      if (shouldMove) {
        movedCount++;
        return {
          ...e,
          x: (e.x ?? 0) + params.deltaX,
          y: (e.y ?? 0) + params.deltaY,
          version: (e.version ?? 0) + 1,
          versionNonce: Math.floor(Math.random() * 2147483647),
        };
      }
      return e;
    });

    if (movedCount === 0) {
      return { type: 'moveElementsResult', id, success: false, error: 'No elements found' };
    }

    await saveElements(ctx, deps, updatedElements as unknown[], scene?.files);

    return { type: 'moveElementsResult', id, success: true, movedCount };
  } catch (error) {
    return { type: 'moveElementsResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Resize Elements Handler
// ============================================================================

export interface ResizeElementsResult {
  type: 'resizeElementsResult';
  id: string;
  success: boolean;
  resizedCount?: number;
  error?: string;
}

export async function handleResizeElements(
  deps: HandlerDeps,
  id: string,
  params: ResizeElementsParams
): Promise<ResizeElementsResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'resizeElementsResult', id, success: false, error: 'Canvas not available' };
  }

  const { top = 0, bottom = 0, left = 0, right = 0 } = params;
  if (top === 0 && bottom === 0 && left === 0 && right === 0) {
    return { type: 'resizeElementsResult', id, success: false, error: 'At least one resize parameter (top, bottom, left, right) must be non-zero' };
  }

  try {
    const { elements, scene } = await getElements(ctx, deps);

    const idsToResize = new Set(params.elementIds);
    const RESIZABLE_TYPES = ['rectangle', 'ellipse', 'diamond', 'image'];
    const BOUND_TEXT_PADDING = 5;

    // Validate all elements are resizable types
    for (const el of elements) {
      if (idsToResize.has(el.id) && !RESIZABLE_TYPES.includes(el.type)) {
        return { type: 'resizeElementsResult', id, success: false, error: `Element ${el.id} is not resizable (type: ${el.type}). Only rectangle, ellipse, diamond, and image are supported.` };
      }
    }

    const updatedContainers = new Map<string, { x: number; y: number; width: number; height: number; type: string }>();
    let resizedCount = 0;

    // First pass: resize shapes
    let updatedElements = elements.map(e => {
      if (!idsToResize.has(e.id)) return e;

      const width = e.width ?? 100;
      const height = e.height ?? 100;
      const angle = e.angle ?? 0;
      const newWidth = width + left + right;
      const newHeight = height + top + bottom;

      if (newWidth <= 0) return { error: `Resulting width (${newWidth}) would be <= 0` };
      if (newHeight <= 0) return { error: `Resulting height (${newHeight}) would be <= 0` };

      // Calculate position adjustment based on rotation
      const localDeltaX = -left;
      const localDeltaY = -top;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const newX = e.x + localDeltaX * cos - localDeltaY * sin;
      const newY = e.y + localDeltaX * sin + localDeltaY * cos;

      updatedContainers.set(e.id, { x: newX, y: newY, width: newWidth, height: newHeight, type: e.type });
      resizedCount++;

      return {
        ...e,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        version: (e.version ?? 0) + 1,
        versionNonce: Math.floor(Math.random() * 2147483647),
      };
    });

    // Check for errors
    for (const el of updatedElements) {
      if ('error' in el) {
        return { type: 'resizeElementsResult', id, success: false, error: el.error as string };
      }
    }

    if (resizedCount === 0) {
      return { type: 'resizeElementsResult', id, success: false, error: 'No elements found' };
    }

    // Second pass: update bound text positions
    let validElements = updatedElements as ExcalidrawElement[];
    validElements = validElements.map(e => {
      if (e.type !== 'text' || !e.containerId) return e;

      const container = updatedContainers.get(e.containerId);
      if (!container) return e;

      const textWidth = e.width ?? 0;
      const textHeight = e.height ?? 0;

      // Calculate offset based on container type
      let offsetX = BOUND_TEXT_PADDING;
      let offsetY = BOUND_TEXT_PADDING;
      if (container.type === 'ellipse') {
        offsetX += (container.width / 2) * (1 - Math.SQRT2 / 2);
        offsetY += (container.height / 2) * (1 - Math.SQRT2 / 2);
      } else if (container.type === 'diamond') {
        offsetX += container.width / 4;
        offsetY += container.height / 4;
      }

      const maxWidth = container.width - 2 * offsetX;
      const maxHeight = container.height - 2 * offsetY;

      return {
        ...e,
        x: container.x + offsetX + (maxWidth - textWidth) / 2,
        y: container.y + offsetY + (maxHeight - textHeight) / 2,
        version: (e.version ?? 0) + 1,
        versionNonce: Math.floor(Math.random() * 2147483647),
      };
    });

    await saveElements(ctx, deps, validElements as unknown[], scene?.files);

    return { type: 'resizeElementsResult', id, success: true, resizedCount };
  } catch (error) {
    return { type: 'resizeElementsResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Read Scene Handler
// ============================================================================

export interface ReadSceneResult {
  type: 'readSceneResult';
  id: string;
  success: boolean;
  elements?: SceneElement[];
  selectedElementIds?: string[];
  error?: string;
}

export async function handleReadScene(
  deps: HandlerDeps,
  id: string
): Promise<ReadSceneResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'readSceneResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const { elements } = await getElements(ctx, deps);

    // Get selection info only when using direct API
    const selectedElementIds = ctx.useDirectStorage
      ? []
      : Object.keys((ctx.api.getAppState() as { selectedElementIds?: Record<string, true> }).selectedElementIds ?? {});

    const sceneElements: SceneElement[] = elements
      .filter(e => !e.isDeleted)
      .map(e => ({
        id: e.id,
        type: e.type,
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        angle: e.angle,
        strokeColor: e.strokeColor,
        backgroundColor: e.backgroundColor,
        groupIds: e.groupIds,
        text: e.text,
        fontSize: e.fontSize,
        containerId: e.containerId,
        boundElements: e.boundElements ? [...e.boundElements] : null,
        points: e.points,
        startArrowhead: e.startArrowhead,
        endArrowhead: e.endArrowhead,
        fileId: e.fileId,
        customData: e.customData,
      }));

    return { type: 'readSceneResult', id, success: true, elements: sceneElements, selectedElementIds };
  } catch (error) {
    return { type: 'readSceneResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Load Scene Handler
// ============================================================================

export interface LoadSceneResult {
  type: 'loadSceneResult';
  id: string;
  success: boolean;
  elementCount?: number;
  error?: string;
}

export async function handleLoadScene(
  deps: HandlerDeps,
  id: string,
  params: LoadSceneParams
): Promise<LoadSceneResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'loadSceneResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const elements = params.elements || [];

    if (ctx.useDirectStorage) {
      await deps.saveAndSync(ctx.canvasId, elements, params.files);
    } else {
      // Load files first if present
      if (params.files) {
        const filesArray = Object.values(params.files as Record<string, BinaryFileData>);
        if (filesArray.length > 0) {
          ctx.api.addFiles(filesArray);
        }
      }
      ctx.api.updateScene({
        elements: elements as readonly unknown[],
        appState: params.appState,
        captureUpdate: deps.CaptureUpdateAction.IMMEDIATELY,
      });
    }

    return { type: 'loadSceneResult', id, success: true, elementCount: elements.length };
  } catch (error) {
    return { type: 'loadSceneResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Save Scene Handler
// ============================================================================

export interface SaveSceneResult {
  type: 'saveSceneResult';
  id: string;
  success: boolean;
  data?: {
    type: 'excalidraw';
    version: number;
    source: string;
    elements: unknown[];
    appState: unknown;
    files: unknown;
  };
  error?: string;
}

export async function handleSaveScene(
  deps: HandlerDeps,
  id: string
): Promise<SaveSceneResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'saveSceneResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const { elements, scene } = await getElements(ctx, deps);
    const visibleElements = elements.filter(e => !e.isDeleted);

    const appState = ctx.useDirectStorage ? (scene?.appState || {}) : ctx.api.getAppState();
    const files = ctx.useDirectStorage ? (scene?.files || {}) : ctx.api.getFiles();

    return {
      type: 'saveSceneResult',
      id,
      success: true,
      data: {
        type: 'excalidraw',
        version: 2,
        source: 'agent-canvas',
        elements: visibleElements,
        appState,
        files,
      },
    };
  } catch (error) {
    return { type: 'saveSceneResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Clear Canvas Handler
// ============================================================================

export interface ClearCanvasResult {
  type: 'clearCanvasResult';
  id: string;
  success: boolean;
  error?: string;
}

export async function handleClearCanvas(
  deps: HandlerDeps,
  id: string
): Promise<ClearCanvasResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'clearCanvasResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    await saveElements(ctx, deps, [], {});
    return { type: 'clearCanvasResult', id, success: true };
  } catch (error) {
    return { type: 'clearCanvasResult', id, success: false, error: formatError(error) };
  }
}

// ============================================================================
// Export Image Handler
// ============================================================================

export interface ExportImageResult {
  type: 'exportImageResult';
  id: string;
  success: boolean;
  dataUrl?: string;
  error?: string;
}

export async function handleExportImage(
  deps: HandlerDeps,
  id: string,
  params: ExportImageParams | undefined,
  exportToBlob: ExportToBlobFn
): Promise<ExportImageResult> {
  const ctx = deps.getContext();
  if (!ctx) {
    return { type: 'exportImageResult', id, success: false, error: 'Canvas not available' };
  }

  try {
    const { elements } = await getElements(ctx, deps);
    const visibleElements = elements.filter(e => !e.isDeleted);

    if (visibleElements.length === 0) {
      return { type: 'exportImageResult', id, success: false, error: 'Canvas is empty' };
    }

    const scale = params?.scale ?? 1;

    const blob = await exportToBlob({
      elements: visibleElements as unknown[],
      files: null,
      appState: {
        exportBackground: params?.background ?? true,
        exportEmbedScene: params?.embedScene ?? false,
        exportWithDarkMode: params?.dark ?? false,
      },
      getDimensions: (width: number, height: number) => ({
        width: width * scale,
        height: height * scale,
        scale,
      }),
    });

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return { type: 'exportImageResult', id, success: true, dataUrl };
  } catch (error) {
    return { type: 'exportImageResult', id, success: false, error: formatError(error) };
  }
}
