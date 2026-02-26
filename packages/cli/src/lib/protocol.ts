export const WS_PORT = parseInt(process.env.AGENT_CANVAS_WS_PORT || '7890', 10);

// ============================================================================
// Canvas Metadata
// ============================================================================

export interface CanvasMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasCategory {
  id: string;
  name: string;
  isCollapsed: boolean;
  order: number;
}

export interface CanvasListState {
  activeCanvasId: string;
  canvases: CanvasMetadata[];
  categories?: CanvasCategory[];
  canvasCategoryMap?: Record<string, string>; // canvasId -> categoryId
}

// ============================================================================
// List Canvases
// ============================================================================

export interface ListCanvasesResponse {
  type: 'listCanvasesResult';
  id: string;
  success: boolean;
  activeCanvasId?: string;        // User's active canvas
  agentActiveCanvasId?: string;   // Agent's active canvas
  canvases?: CanvasMetadata[];
  categories?: CanvasCategory[];
  canvasCategoryMap?: Record<string, string>;
  error?: string;
}

// ============================================================================
// Create Canvas
// ============================================================================

export interface CreateCanvasParams {
  name: string;
  switchTo?: boolean;
}

export interface CreateCanvasResponse {
  type: 'createCanvasResult';
  id: string;
  success: boolean;
  canvas?: CanvasMetadata;
  error?: string;
}

// ============================================================================
// Switch Canvas
// ============================================================================

export interface SwitchCanvasParams {
  name: string;
}

export interface SwitchCanvasResponse {
  type: 'switchCanvasResult';
  id: string;
  success: boolean;
  canvas?: CanvasMetadata;
  error?: string;
}

// ============================================================================
// Rename Canvas
// ============================================================================

export interface RenameCanvasParams {
  newName: string;
}

export interface RenameCanvasResponse {
  type: 'renameCanvasResult';
  id: string;
  success: boolean;
  canvas?: CanvasMetadata;
  error?: string;
}

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
  animated?: boolean;
}

export interface AddShapeResponse {
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

// ============================================================================
// Add Text
// ============================================================================

// Alignment determines which point of the text bounding box the x,y coordinates refer to
export type TextAnchor = 'topLeft' | 'topCenter' | 'topRight' | 'leftCenter' | 'center' | 'rightCenter' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

export interface AddTextParams {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  anchor?: TextAnchor;  // defaults to 'bottomLeft'
  strokeColor?: string;
  customData?: Record<string, unknown>;
  animated?: boolean;
}

export interface AddTextResponse {
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
  animated?: boolean;
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
  arrowType?: 'sharp' | 'round' | 'elbow';
  // Intermediate points (absolute coordinates)
  // - For round arrows: one point as the curve control point
  // - For elbow arrows: multiple points for 90-degree turns
  midpoints?: Array<{ x: number; y: number }>;
  customData?: Record<string, unknown>;
  animated?: boolean;
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
  animated?: boolean;
}

export interface AddPolygonResponse {
  type: 'addPolygonResult';
  id: string;
  success: boolean;
  elementId?: string;
  error?: string;
}

// ============================================================================
// Add Image
// ============================================================================

export interface AddImageParams {
  x: number;
  y: number;
  width?: number;
  height?: number;
  dataUrl: string;      // Base64 DataURL (e.g., "data:image/png;base64,...")
  mimeType: string;     // image/png, image/jpeg, image/svg+xml, image/gif, image/webp
  fileId: string;       // Unique file identifier (SHA-1 hash or nanoid)
  customData?: Record<string, unknown>;
}

export interface AddImageResponse {
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
// Resize Elements
// ============================================================================

export interface ResizeElementsParams {
  elementIds: string[];
  top?: number;     // Positive = expand upward (in element's local coordinate system)
  bottom?: number;  // Positive = expand downward
  left?: number;    // Positive = expand leftward
  right?: number;   // Positive = expand rightward
}

export interface ResizeElementsResponse {
  type: 'resizeElementsResult';
  id: string;
  success: boolean;
  resizedCount?: number;
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
  // For image elements
  fileId?: string | null;
  customData?: Record<string, unknown>;
}

export interface ReadSceneResponse {
  type: 'readSceneResult';
  id: string;
  success: boolean;
  elements?: SceneElement[];
  selectedElementIds?: string[];
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

// ============================================================================
// Clear Canvas
// ============================================================================

export interface ClearCanvasResponse {
  type: 'clearCanvasResult';
  id: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Create Folder
// ============================================================================

export interface CreateFolderParams {
  name: string;
}

export interface CreateFolderResponse {
  type: 'createFolderResult';
  id: string;
  success: boolean;
  category?: CanvasCategory;
  error?: string;
}

// ============================================================================
// Delete Folder
// ============================================================================

export interface DeleteFolderParams {
  name: string;
}

export interface DeleteFolderResponse {
  type: 'deleteFolderResult';
  id: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Move Canvas to Folder
// ============================================================================

export interface MoveCanvasToFolderParams {
  canvasName: string;
  folderName: string | null;
}

export interface MoveCanvasToFolderResponse {
  type: 'moveCanvasToFolderResult';
  id: string;
  success: boolean;
  error?: string;
}
