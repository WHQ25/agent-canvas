export const WS_PORT = 7890;

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
// Read Scene
// ============================================================================

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
  // For line/arrow elements
  points?: number[][];
  startArrowhead?: string | null;
  endArrowhead?: string | null;
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
  | AddShapeRequest
  | AddTextRequest
  | AddLineRequest
  | AddArrowRequest
  | AddPolygonRequest
  | DeleteElementsRequest
  | RotateElementsRequest
  | GroupElementsRequest
  | UngroupElementRequest
  | MoveElementsRequest
  | ReadSceneRequest
  | LoadSceneRequest
  | SaveSceneRequest
  | ExportImageRequest;

export type ResponseMessage =
  | PongMessage
  | AddShapeResponse
  | AddTextResponse
  | AddLineResponse
  | AddArrowResponse
  | AddPolygonResponse
  | DeleteElementsResponse
  | RotateElementsResponse
  | GroupElementsResponse
  | UngroupElementResponse
  | MoveElementsResponse
  | ReadSceneResponse
  | LoadSceneResponse
  | SaveSceneResponse
  | ExportImageResponse;

export type Message = RequestMessage | ResponseMessage;

const MESSAGE_TYPES = [
  'ping', 'pong',
  'addShape', 'addShapeResult',
  'addText', 'addTextResult',
  'addLine', 'addLineResult',
  'addArrow', 'addArrowResult',
  'addPolygon', 'addPolygonResult',
  'deleteElements', 'deleteElementsResult',
  'rotateElements', 'rotateElementsResult',
  'groupElements', 'groupElementsResult',
  'ungroupElement', 'ungroupElementResult',
  'moveElements', 'moveElementsResult',
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
