export const WS_PORT = 7890;

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

export interface ListCanvasesRequest {
  type: 'listCanvases';
  id: string;
}

export interface ListCanvasesResponse {
  type: 'listCanvasesResult';
  id: string;
  success: boolean;
  activeCanvasId?: string;        // User's active canvas
  agentActiveCanvasId?: string;   // Agent's active canvas
  canvases?: CanvasMetadata[];
  error?: string;
}

// ============================================================================
// Create Canvas
// ============================================================================

export interface CreateCanvasParams {
  name: string;
  switchTo?: boolean;
}

export interface CreateCanvasRequest {
  type: 'createCanvas';
  id: string;
  params: CreateCanvasParams;
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

export interface SwitchCanvasRequest {
  type: 'switchCanvas';
  id: string;
  params: SwitchCanvasParams;
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

export interface RenameCanvasRequest {
  type: 'renameCanvas';
  id: string;
  params: RenameCanvasParams;
}

export interface RenameCanvasResponse {
  type: 'renameCanvasResult';
  id: string;
  success: boolean;
  canvas?: CanvasMetadata;
  error?: string;
}

// ============================================================================
// Base Messages
// ============================================================================

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
}

// ============================================================================
// Common Types
// ============================================================================

export interface SuccessResponse {
  id: string;
  success: true;
  elementId?: string;
}

export interface ErrorResponse {
  id: string;
  success: false;
  error: string;
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
}

export interface AddShapeRequest {
  type: 'addShape';
  id: string;
  params: AddShapeParams;
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
}

export interface AddTextRequest {
  type: 'addText';
  id: string;
  params: AddTextParams;
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
}

export interface AddLineRequest {
  type: 'addLine';
  id: string;
  params: AddLineParams;
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
}

export interface AddArrowRequest {
  type: 'addArrow';
  id: string;
  params: AddArrowParams;
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

export interface AddPolygonRequest {
  type: 'addPolygon';
  id: string;
  params: AddPolygonParams;
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

export interface AddImageRequest {
  type: 'addImage';
  id: string;
  params: AddImageParams;
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

export interface DeleteElementsRequest {
  type: 'deleteElements';
  id: string;
  params: DeleteElementsParams;
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
  angle: number; // Degrees, positive = clockwise
}

export interface RotateElementsRequest {
  type: 'rotateElements';
  id: string;
  params: RotateElementsParams;
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

export interface GroupElementsRequest {
  type: 'groupElements';
  id: string;
  params: GroupElementsParams;
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

export interface UngroupElementRequest {
  type: 'ungroupElement';
  id: string;
  params: UngroupElementParams;
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

export interface MoveElementsRequest {
  type: 'moveElements';
  id: string;
  params: MoveElementsParams;
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

export interface ResizeElementsRequest {
  type: 'resizeElements';
  id: string;
  params: ResizeElementsParams;
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
  // Custom data
  customData?: Record<string, unknown>;
}

export interface ReadSceneRequest {
  type: 'readScene';
  id: string;
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

export interface LoadSceneRequest {
  type: 'loadScene';
  id: string;
  params: LoadSceneParams;
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

export interface SaveSceneRequest {
  type: 'saveScene';
  id: string;
}

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

export interface ExportImageParams {
  background?: boolean; // Include background color (default: true)
  dark?: boolean; // Dark mode (default: false)
  embedScene?: boolean; // Embed scene data in PNG (default: false)
  scale?: 1 | 2 | 3; // Export scale (default: 1)
}

export interface ExportImageRequest {
  type: 'exportImage';
  id: string;
  params?: ExportImageParams;
}

export interface ExportImageResponse {
  type: 'exportImageResult';
  id: string;
  success: boolean;
  dataUrl?: string; // Base64 PNG data URL
  error?: string;
}

// ============================================================================
// Message Types
// ============================================================================

export type RequestMessage =
  | PingMessage
  | ListCanvasesRequest
  | CreateCanvasRequest
  | SwitchCanvasRequest
  | RenameCanvasRequest
  | AddShapeRequest
  | AddTextRequest
  | AddLineRequest
  | AddArrowRequest
  | AddPolygonRequest
  | AddImageRequest
  | DeleteElementsRequest
  | RotateElementsRequest
  | GroupElementsRequest
  | UngroupElementRequest
  | MoveElementsRequest
  | ResizeElementsRequest
  | ReadSceneRequest
  | LoadSceneRequest
  | SaveSceneRequest
  | ExportImageRequest;

export type ResponseMessage =
  | PongMessage
  | ListCanvasesResponse
  | CreateCanvasResponse
  | SwitchCanvasResponse
  | RenameCanvasResponse
  | AddShapeResponse
  | AddTextResponse
  | AddLineResponse
  | AddArrowResponse
  | AddPolygonResponse
  | AddImageResponse
  | DeleteElementsResponse
  | RotateElementsResponse
  | GroupElementsResponse
  | UngroupElementResponse
  | MoveElementsResponse
  | ResizeElementsResponse
  | ReadSceneResponse
  | LoadSceneResponse
  | SaveSceneResponse
  | ExportImageResponse;

export type Message = RequestMessage | ResponseMessage;

const MESSAGE_TYPES = [
  'ping', 'pong',
  'listCanvases', 'listCanvasesResult',
  'createCanvas', 'createCanvasResult',
  'switchCanvas', 'switchCanvasResult',
  'renameCanvas', 'renameCanvasResult',
  'addShape', 'addShapeResult',
  'addText', 'addTextResult',
  'addLine', 'addLineResult',
  'addArrow', 'addArrowResult',
  'addPolygon', 'addPolygonResult',
  'addImage', 'addImageResult',
  'deleteElements', 'deleteElementsResult',
  'rotateElements', 'rotateElementsResult',
  'groupElements', 'groupElementsResult',
  'ungroupElement', 'ungroupElementResult',
  'moveElements', 'moveElementsResult',
  'resizeElements', 'resizeElementsResult',
  'readScene', 'readSceneResult',
  'loadScene', 'loadSceneResult',
  'saveScene', 'saveSceneResult',
  'exportImage', 'exportImageResult',
] as const;

export function isMessage(data: unknown): data is Message {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as { type?: unknown };
  return MESSAGE_TYPES.includes(msg.type as typeof MESSAGE_TYPES[number]);
}
