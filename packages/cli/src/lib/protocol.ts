export const WS_PORT = 7890;

// ============================================================================
// Add Shape
// ============================================================================

export interface AddShapeParams {
  type: 'rectangle' | 'ellipse' | 'diamond';
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  fillStyle?: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag';
  label?: {
    text: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    strokeColor?: string;
  };
  customData?: Record<string, unknown>;
}

export interface AddShapeResponse {
  type: 'addShapeResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

// ============================================================================
// Add Text
// ============================================================================

export interface AddTextParams {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  strokeColor?: string;
  customData?: Record<string, unknown>;
}

export interface AddTextResponse {
  type: 'addTextResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

// ============================================================================
// Add Line
// ============================================================================

export interface AddLineParams {
  x: number;
  y: number;
  endX: number;
  endY: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  customData?: Record<string, unknown>;
}

export interface AddLineResponse {
  type: 'addLineResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

// ============================================================================
// Add Arrow
// ============================================================================

export interface AddArrowParams {
  x: number;
  y: number;
  endX: number;
  endY: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  startArrowhead?: 'arrow' | 'bar' | 'dot' | 'triangle' | 'diamond' | 'none';
  endArrowhead?: 'arrow' | 'bar' | 'dot' | 'triangle' | 'diamond' | 'none';
  customData?: Record<string, unknown>;
}

export interface AddArrowResponse {
  type: 'addArrowResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

// ============================================================================
// Add Polygon
// ============================================================================

export interface AddPolygonParams {
  points: Array<{ x: number; y: number }>;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  fillStyle?: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag';
  customData?: Record<string, unknown>;
}

export interface AddPolygonResponse {
  type: 'addPolygonResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

// ============================================================================
// Delete Elements
// ============================================================================

export interface DeleteElementsParams {
  elementIds: string[];
}

export interface DeleteElementsResponse {
  type: 'deleteElementsResult';
  id: string;
  success: boolean;
  deletedCount?: number;
  error?: string;
}

// ============================================================================
// Rotate Elements
// ============================================================================

export interface RotateElementsParams {
  elementIds: string[];
  angle: number;
}

export interface RotateElementsResponse {
  type: 'rotateElementsResult';
  id: string;
  success: boolean;
  rotatedCount?: number;
  error?: string;
}

// ============================================================================
// Group Elements
// ============================================================================

export interface GroupElementsParams {
  elementIds: string[];
}

export interface GroupElementsResponse {
  type: 'groupElementsResult';
  id: string;
  success: boolean;
  groupId?: string;
  error?: string;
}

// ============================================================================
// Ungroup Element
// ============================================================================

export interface UngroupElementParams {
  elementId: string;
}

export interface UngroupElementResponse {
  type: 'ungroupElementResult';
  id: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Move Elements
// ============================================================================

export interface MoveElementsParams {
  elementIds: string[];
  deltaX: number;
  deltaY: number;
}

export interface MoveElementsResponse {
  type: 'moveElementsResult';
  id: string;
  success: boolean;
  movedCount?: number;
  error?: string;
}

// ============================================================================
// Read Scene
// ============================================================================

export interface BoundElement {
  id: string;
  type: 'arrow' | 'text';
}

export interface SceneElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle?: number;
  strokeColor?: string;
  backgroundColor?: string;
  groupIds?: string[];
  // For text elements
  text?: string;
  fontSize?: number;
  containerId?: string | null;
  // For bindable elements (rectangle, ellipse, diamond, arrow, line)
  boundElements?: BoundElement[] | null;
  // For line/arrow elements
  points?: number[][];
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  customData?: Record<string, unknown>;
}

export interface ReadSceneResponse {
  type: 'readSceneResult';
  id: string;
  success: boolean;
  elements?: SceneElement[];
  error?: string;
}

// ============================================================================
// Load Scene
// ============================================================================

export interface LoadSceneParams {
  elements: unknown[];
  appState?: unknown;
  files?: unknown;
}

export interface LoadSceneResponse {
  type: 'loadSceneResult';
  id: string;
  success: boolean;
  elementCount?: number;
  error?: string;
}

// ============================================================================
// Save Scene
// ============================================================================

export interface SaveSceneResponse {
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

// ============================================================================
// Export Image
// ============================================================================

export interface ExportImageResponse {
  type: 'exportImageResult';
  id: string;
  success: boolean;
  dataUrl?: string;
  error?: string;
}
