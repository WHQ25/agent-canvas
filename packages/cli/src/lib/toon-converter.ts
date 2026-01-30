import type { SceneElement } from './protocol.js';

// ============================================================================
// Types
// ============================================================================

export interface ToonShape {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number | null;
  h: number | null;
  angle: number;
  labelId: string | null;
  note: string | null;
  stroke?: string | null;
  bg?: string | null;
}

export interface ToonLine {
  id: string;
  type: string;
  x: number;
  y: number;
  endX: number;
  endY: number;
  via: string | null;
  angle: number;
  note: string | null;
  stroke?: string | null;
}

export interface ToonLabel {
  id: string;
  containerId: string;
  content: string;
  x: number;
  y: number;
  w: number | null;
  h: number | null;
}

export interface ToonText {
  id: string;
  content: string;
  x: number;
  y: number;
  w: number | null;
  h: number | null;
  angle: number;
  note: string | null;
  stroke?: string | null;
}

export interface ToonImage {
  id: string;
  x: number;
  y: number;
  w: number | null;
  h: number | null;
  angle: number;
  fileId: string | null;
  note: string | null;
}

export interface ToonGroup {
  id: string;
  elementIds: string;
}

export interface ToonResult {
  shapes: ToonShape[];
  lines: ToonLine[];
  labels: ToonLabel[];
  texts: ToonText[];
  images: ToonImage[];
  groups: ToonGroup[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract custom note from element
 */
function extractNote(el: SceneElement): string | null {
  return (el.customData as { note?: string } | undefined)?.note ?? null;
}

/**
 * Convert radians to degrees and round
 */
function radiansToDegreesRounded(radians: number | undefined): number {
  return radians ? Math.round(radians * 180 / Math.PI) : 0;
}

/**
 * Check if a line element is a closed polygon
 * (first and last point within 8px threshold)
 */
function isClosedPolygon(points: number[][]): boolean {
  if (points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  const distance = Math.sqrt((last[0] - first[0]) ** 2 + (last[1] - first[1]) ** 2);
  return distance <= 8;
}

// ============================================================================
// Element Processors
// ============================================================================

/**
 * Process a text element - returns either a label (bound text) or standalone text
 */
export function processTextElement(
  el: SceneElement,
  withStyle: boolean
): { type: 'label'; data: ToonLabel } | { type: 'text'; data: ToonText } {
  if (el.containerId) {
    // Bound text (label)
    return {
      type: 'label',
      data: {
        id: el.id,
        containerId: el.containerId,
        content: el.text ?? '',
        x: Math.round(el.x),
        y: Math.round(el.y),
        w: el.width !== undefined ? Math.round(el.width) : null,
        h: el.height !== undefined ? Math.round(el.height) : null,
      },
    };
  }

  // Standalone text
  const angle = radiansToDegreesRounded(el.angle);
  const text: ToonText = {
    id: el.id,
    content: el.text ?? '',
    x: Math.round(el.x),
    y: Math.round(el.y),
    w: el.width !== undefined ? Math.round(el.width) : null,
    h: el.height !== undefined ? Math.round(el.height) : null,
    angle,
    note: extractNote(el),
  };
  if (withStyle) {
    text.stroke = el.strokeColor ?? null;
  }
  return { type: 'text', data: text };
}

/**
 * Process a line/arrow element - returns either a shape (polygon) or line
 */
export function processLineElement(
  el: SceneElement,
  withStyle: boolean
): { type: 'shape'; data: ToonShape } | { type: 'line'; data: ToonLine } {
  const pts = el.points ?? [];
  const angle = radiansToDegreesRounded(el.angle);

  // Check if it's a closed polygon
  if (el.type === 'line' && isClosedPolygon(pts)) {
    // Polygon - treat as shape
    // Calculate bounding box from points
    const xs = pts.map(p => p[0]);
    const ys = pts.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const shape: ToonShape = {
      id: el.id,
      type: 'polygon',
      x: Math.round(el.x + minX),
      y: Math.round(el.y + minY),
      w: Math.round(maxX - minX),
      h: Math.round(maxY - minY),
      angle,
      labelId: null,
      note: extractNote(el),
    };
    if (withStyle) {
      shape.stroke = el.strokeColor ?? null;
      shape.bg = el.backgroundColor ?? null;
    }
    return { type: 'shape', data: shape };
  }

  // Line/Arrow element
  const lastPt = pts.length > 0 ? pts[pts.length - 1] : [0, 0];
  const line: ToonLine = {
    id: el.id,
    type: el.type,
    x: Math.round(el.x),
    y: Math.round(el.y),
    endX: Math.round(el.x + lastPt[0]),
    endY: Math.round(el.y + lastPt[1]),
    // Show intermediate points (via) in the same format as --via input
    via: pts.length > 2
      ? pts.slice(1, -1).map(pt => `${Math.round(el.x + pt[0])},${Math.round(el.y + pt[1])}`).join(';')
      : null,
    angle,
    note: extractNote(el),
  };
  if (withStyle) {
    line.stroke = el.strokeColor ?? null;
  }
  return { type: 'line', data: line };
}

/**
 * Process a shape element (rectangle, ellipse, diamond, etc.)
 */
export function processShapeElement(el: SceneElement, withStyle: boolean): ToonShape {
  const angle = radiansToDegreesRounded(el.angle);
  const boundText = el.boundElements?.find(b => b.type === 'text');

  const shape: ToonShape = {
    id: el.id,
    type: el.type,
    x: Math.round(el.x),
    y: Math.round(el.y),
    w: el.width !== undefined ? Math.round(el.width) : null,
    h: el.height !== undefined ? Math.round(el.height) : null,
    angle,
    labelId: boundText?.id ?? null,
    note: extractNote(el),
  };
  if (withStyle) {
    shape.stroke = el.strokeColor ?? null;
    shape.bg = el.backgroundColor ?? null;
  }
  return shape;
}

/**
 * Process an image element
 */
export function processImageElement(el: SceneElement): ToonImage {
  const angle = radiansToDegreesRounded(el.angle);

  return {
    id: el.id,
    x: Math.round(el.x),
    y: Math.round(el.y),
    w: el.width !== undefined ? Math.round(el.width) : null,
    h: el.height !== undefined ? Math.round(el.height) : null,
    angle,
    fileId: el.fileId ?? null,
    note: extractNote(el),
  };
}

/**
 * Build groups array from elements
 */
export function buildGroupsFromElements(elements: SceneElement[]): ToonGroup[] {
  const groupsMap = new Map<string, string[]>();

  for (const el of elements) {
    if (el.groupIds?.length) {
      for (const groupId of el.groupIds) {
        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, []);
        }
        groupsMap.get(groupId)!.push(el.id);
      }
    }
  }

  return Array.from(groupsMap.entries()).map(([id, elementIds]) => ({
    id,
    elementIds: elementIds.join(','),
  }));
}

// ============================================================================
// Main Converter
// ============================================================================

/**
 * Convert Excalidraw elements to TOON format data structure
 */
export function convertElementsToToon(elements: SceneElement[], withStyle: boolean): ToonResult {
  const shapes: ToonShape[] = [];
  const lines: ToonLine[] = [];
  const labels: ToonLabel[] = [];
  const texts: ToonText[] = [];
  const images: ToonImage[] = [];

  for (const el of elements) {
    if (el.type === 'text') {
      const result = processTextElement(el, withStyle);
      if (result.type === 'label') {
        labels.push(result.data);
      } else {
        texts.push(result.data);
      }
    } else if (el.type === 'line' || el.type === 'arrow') {
      const result = processLineElement(el, withStyle);
      if (result.type === 'shape') {
        shapes.push(result.data);
      } else {
        lines.push(result.data);
      }
    } else if (el.type === 'image') {
      images.push(processImageElement(el));
    } else {
      // Shape element (rectangle, ellipse, diamond, etc.)
      shapes.push(processShapeElement(el, withStyle));
    }
  }

  const groups = buildGroupsFromElements(elements);

  return { shapes, lines, labels, texts, images, groups };
}
