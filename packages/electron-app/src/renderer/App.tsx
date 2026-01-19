import { useEffect, useRef } from 'react';
import { Excalidraw, convertToExcalidrawElements, exportToBlob } from '@excalidraw/excalidraw';
import type {
  AddShapeRequest, AddShapeResponse, AddShapeParams,
  AddTextRequest, AddTextResponse, AddTextParams,
  AddLineRequest, AddLineResponse, AddLineParams,
  AddArrowRequest, AddArrowResponse, AddArrowParams,
  AddPolygonRequest, AddPolygonResponse, AddPolygonParams,
  DeleteElementRequest, DeleteElementResponse, DeleteElementParams,
  RotateElementRequest, RotateElementResponse, RotateElementParams,
  GroupElementsRequest, GroupElementsResponse, GroupElementsParams,
  UngroupElementRequest, UngroupElementResponse, UngroupElementParams,
  MoveElementsRequest, MoveElementsResponse, MoveElementsParams,
  ReadSceneResponse, SceneElement,
  LoadSceneRequest, LoadSceneResponse, LoadSceneParams,
  SaveSceneResponse,
  ExportImageRequest, ExportImageResponse, ExportImageParams,
} from '../shared/protocol';

// Simplified Excalidraw API type
interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  groupIds?: string[];
  angle?: number;
  isDeleted?: boolean;
  strokeColor?: string;
  backgroundColor?: string;
  // Text
  text?: string;
  fontSize?: number;
  // Line/Arrow
  points?: number[][];
  startArrowhead?: string | null;
  endArrowhead?: string | null;
}

interface ExcalidrawAPI {
  getSceneElements: () => readonly ExcalidrawElement[];
  getAppState: () => unknown;
  getFiles: () => unknown;
  updateScene: (scene: {
    elements?: readonly unknown[];
    appState?: unknown;
    captureUpdate?: 'immediately' | 'eventually' | 'none';
  }) => void;
}

export default function App() {
  const excalidrawAPIRef = useRef<ExcalidrawAPI | null>(null);

  // ============================================================================
  // Add Shape
  // ============================================================================
  const handleAddShape = (id: string, params: AddShapeParams): AddShapeResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'addShapeResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shapeSkeleton: any = {
        type: params.type,
        x: params.x,
        y: params.y,
        strokeColor: params.strokeColor ?? '#1e1e1e',
        backgroundColor: params.backgroundColor ?? 'transparent',
        strokeWidth: params.strokeWidth ?? 2,
        strokeStyle: params.strokeStyle ?? 'solid',
        fillStyle: params.fillStyle ?? 'hachure',
      };

      if (params.width !== undefined) shapeSkeleton.width = params.width;
      if (params.height !== undefined) shapeSkeleton.height = params.height;

      if (params.label) {
        shapeSkeleton.label = {
          text: params.label.text.replace(/\\n/g, '\n'),
          fontSize: params.label.fontSize ?? 20,
          textAlign: params.label.textAlign ?? 'center',
          verticalAlign: params.label.verticalAlign ?? 'middle',
          strokeColor: params.label.strokeColor,
        };
      }

      const newElements = convertToExcalidrawElements([shapeSkeleton]);

      api.updateScene({
        elements: [...elements, ...newElements],
        captureUpdate: 'immediately',
      });

      return { type: 'addShapeResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addShapeResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Add Text
  // ============================================================================
  const handleAddText = (id: string, params: AddTextParams): AddTextResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'addTextResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textSkeleton: any = {
        type: 'text',
        text: params.text.replace(/\\n/g, '\n'),
        x: params.x,
        y: params.y,
        fontSize: params.fontSize ?? 20,
        textAlign: params.textAlign ?? 'left',
        strokeColor: params.strokeColor ?? '#1e1e1e',
      };

      const newElements = convertToExcalidrawElements([textSkeleton]);

      api.updateScene({
        elements: [...elements, ...newElements],
        captureUpdate: 'immediately',
      });

      return { type: 'addTextResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addTextResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Add Line
  // ============================================================================
  const handleAddLine = (id: string, params: AddLineParams): AddLineResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'addLineResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lineSkeleton: any = {
        type: 'line',
        x: params.x,
        y: params.y,
        points: [[0, 0], [params.endX - params.x, params.endY - params.y]],
        strokeColor: params.strokeColor ?? '#1e1e1e',
        strokeWidth: params.strokeWidth ?? 2,
        strokeStyle: params.strokeStyle ?? 'solid',
      };

      const newElements = convertToExcalidrawElements([lineSkeleton]);

      api.updateScene({
        elements: [...elements, ...newElements],
        captureUpdate: 'immediately',
      });

      return { type: 'addLineResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addLineResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Add Arrow
  // ============================================================================
  const handleAddArrow = (id: string, params: AddArrowParams): AddArrowResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'addArrowResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arrowSkeleton: any = {
        type: 'arrow',
        x: params.x,
        y: params.y,
        points: [[0, 0], [params.endX - params.x, params.endY - params.y]],
        strokeColor: params.strokeColor ?? '#1e1e1e',
        strokeWidth: params.strokeWidth ?? 2,
        strokeStyle: params.strokeStyle ?? 'solid',
        startArrowhead: params.startArrowhead ?? null,
        endArrowhead: params.endArrowhead ?? 'arrow',
      };

      const newElements = convertToExcalidrawElements([arrowSkeleton]);

      api.updateScene({
        elements: [...elements, ...newElements],
        captureUpdate: 'immediately',
      });

      return { type: 'addArrowResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addArrowResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Add Polygon (using line with closed path)
  // ============================================================================
  const handleAddPolygon = (id: string, params: AddPolygonParams): AddPolygonResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'addPolygonResult', id, success: false, error: 'Canvas not ready' };
    }

    if (params.points.length < 3) {
      return { type: 'addPolygonResult', id, success: false, error: 'Polygon requires at least 3 points' };
    }

    try {
      const elements = api.getSceneElements();

      const firstPoint = params.points[0];
      const points = params.points.map(p => [p.x - firstPoint.x, p.y - firstPoint.y]);
      // Close the polygon
      points.push([0, 0]);

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
      };

      const newElements = convertToExcalidrawElements([polygonSkeleton]);

      api.updateScene({
        elements: [...elements, ...newElements],
        captureUpdate: 'immediately',
      });

      return { type: 'addPolygonResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addPolygonResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Delete Element
  // ============================================================================
  const handleDeleteElement = (id: string, params: DeleteElementParams): DeleteElementResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'deleteElementResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
      const elementToDelete = elements.find(e => e.id === params.elementId);

      if (!elementToDelete) {
        return { type: 'deleteElementResult', id, success: false, error: 'Element not found' };
      }

      // Mark element as deleted
      const updatedElements = elements.map(e =>
        e.id === params.elementId ? { ...e, isDeleted: true } : e
      );

      api.updateScene({
        elements: updatedElements,
        captureUpdate: 'immediately',
      });

      return { type: 'deleteElementResult', id, success: true };
    } catch (error) {
      return { type: 'deleteElementResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Rotate Element
  // ============================================================================
  const handleRotateElement = (id: string, params: RotateElementParams): RotateElementResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'rotateElementResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
      const element = elements.find(e => e.id === params.elementId);

      if (!element) {
        return { type: 'rotateElementResult', id, success: false, error: 'Element not found' };
      }

      const angleInRadians = (params.angle * Math.PI) / 180;
      let rotatedCount = 0;

      // If element is in a group, rotate all elements in that group
      const groupId = element.groupIds?.[0];
      const updatedElements = elements.map(e => {
        const shouldRotate = groupId
          ? e.groupIds?.includes(groupId)
          : e.id === params.elementId;

        if (shouldRotate) {
          rotatedCount++;
          return { ...e, angle: (e.angle ?? 0) + angleInRadians };
        }
        return e;
      });

      api.updateScene({
        elements: updatedElements,
        captureUpdate: 'immediately',
      });

      return { type: 'rotateElementResult', id, success: true, rotatedCount };
    } catch (error) {
      return { type: 'rotateElementResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Group Elements
  // ============================================================================
  const handleGroupElements = (id: string, params: GroupElementsParams): GroupElementsResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'groupElementsResult', id, success: false, error: 'Canvas not ready' };
    }

    if (params.elementIds.length < 2) {
      return { type: 'groupElementsResult', id, success: false, error: 'At least 2 elements required for grouping' };
    }

    try {
      const elements = api.getSceneElements();
      const newGroupId = Math.random().toString(36).substring(2, 15);

      const updatedElements = elements.map(e => {
        if (params.elementIds.includes(e.id)) {
          return { ...e, groupIds: [...(e.groupIds ?? []), newGroupId] };
        }
        return e;
      });

      api.updateScene({
        elements: updatedElements,
        captureUpdate: 'immediately',
      });

      return { type: 'groupElementsResult', id, success: true, groupId: newGroupId };
    } catch (error) {
      return { type: 'groupElementsResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Ungroup Element
  // ============================================================================
  const handleUngroupElement = (id: string, params: UngroupElementParams): UngroupElementResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'ungroupElementResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
      const element = elements.find(e => e.id === params.elementId);

      if (!element) {
        return { type: 'ungroupElementResult', id, success: false, error: 'Element not found' };
      }

      if (!element.groupIds?.length) {
        return { type: 'ungroupElementResult', id, success: false, error: 'Element is not in any group' };
      }

      // Remove the last (most recent) group
      const updatedElements = elements.map(e => {
        if (e.id === params.elementId) {
          return { ...e, groupIds: e.groupIds?.slice(0, -1) ?? [] };
        }
        return e;
      });

      api.updateScene({
        elements: updatedElements,
        captureUpdate: 'immediately',
      });

      return { type: 'ungroupElementResult', id, success: true };
    } catch (error) {
      return { type: 'ungroupElementResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Move Elements
  // ============================================================================
  const handleMoveElements = (id: string, params: MoveElementsParams): MoveElementsResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'moveElementsResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
      let movedCount = 0;

      const updatedElements = elements.map(e => {
        if (params.elementIds.includes(e.id)) {
          movedCount++;
          return {
            ...e,
            x: (e.x ?? 0) + params.deltaX,
            y: (e.y ?? 0) + params.deltaY,
          };
        }
        return e;
      });

      api.updateScene({
        elements: updatedElements,
        captureUpdate: 'immediately',
      });

      return { type: 'moveElementsResult', id, success: true, movedCount };
    } catch (error) {
      return { type: 'moveElementsResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Read Scene
  // ============================================================================
  const handleReadScene = (id: string): ReadSceneResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'readSceneResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();

      // Filter out deleted elements and map to SceneElement
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
          points: e.points,
          startArrowhead: e.startArrowhead,
          endArrowhead: e.endArrowhead,
        }));

      return { type: 'readSceneResult', id, success: true, elements: sceneElements };
    } catch (error) {
      return { type: 'readSceneResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Load Scene
  // ============================================================================
  const handleLoadScene = (id: string, params: LoadSceneParams): LoadSceneResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'loadSceneResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = params.elements || [];

      api.updateScene({
        elements: elements as readonly unknown[],
        captureUpdate: 'immediately',
      });

      return { type: 'loadSceneResult', id, success: true, elementCount: elements.length };
    } catch (error) {
      return { type: 'loadSceneResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Save Scene
  // ============================================================================
  const handleSaveScene = (id: string): SaveSceneResponse => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'saveSceneResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements().filter(e => !e.isDeleted);
      const appState = api.getAppState();
      const files = api.getFiles();

      return {
        type: 'saveSceneResult',
        id,
        success: true,
        data: {
          type: 'excalidraw',
          version: 2,
          source: 'agent-canvas',
          elements: elements as unknown[],
          appState,
          files,
        },
      };
    } catch (error) {
      return { type: 'saveSceneResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Export Image
  // ============================================================================
  const handleExportImage = async (id: string, params?: ExportImageParams): Promise<ExportImageResponse> => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'exportImageResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements().filter(e => !e.isDeleted);

      if (elements.length === 0) {
        return { type: 'exportImageResult', id, success: false, error: 'Canvas is empty' };
      }

      const scale = params?.scale ?? 1;
      const dark = params?.dark ?? false;

      const blob = await exportToBlob({
        elements: elements as never,
        files: null,
        appState: {
          exportBackground: params?.background ?? true,
          exportEmbedScene: params?.embedScene ?? false,
          exportWithDarkMode: dark,
        },
        getDimensions: (width: number, height: number) => ({
          width: width * scale,
          height: height * scale,
          scale,
        }),
      });

      // Convert blob to data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      return { type: 'exportImageResult', id, success: true, dataUrl };
    } catch (error) {
      return { type: 'exportImageResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // ============================================================================
  // Command Handler
  // ============================================================================
  useEffect(() => {
    if (!window.canvasAPI) return;

    window.canvasAPI.onCommand(async (command: unknown) => {
      const msg = command as { type: string; id: string };
      let result: unknown;

      switch (msg.type) {
        case 'addShape':
          result = handleAddShape(msg.id, (command as AddShapeRequest).params);
          break;
        case 'addText':
          result = handleAddText(msg.id, (command as AddTextRequest).params);
          break;
        case 'addLine':
          result = handleAddLine(msg.id, (command as AddLineRequest).params);
          break;
        case 'addArrow':
          result = handleAddArrow(msg.id, (command as AddArrowRequest).params);
          break;
        case 'addPolygon':
          result = handleAddPolygon(msg.id, (command as AddPolygonRequest).params);
          break;
        case 'deleteElement':
          result = handleDeleteElement(msg.id, (command as DeleteElementRequest).params);
          break;
        case 'rotateElement':
          result = handleRotateElement(msg.id, (command as RotateElementRequest).params);
          break;
        case 'groupElements':
          result = handleGroupElements(msg.id, (command as GroupElementsRequest).params);
          break;
        case 'ungroupElement':
          result = handleUngroupElement(msg.id, (command as UngroupElementRequest).params);
          break;
        case 'moveElements':
          result = handleMoveElements(msg.id, (command as MoveElementsRequest).params);
          break;
        case 'readScene':
          result = handleReadScene(msg.id);
          break;
        case 'loadScene':
          result = handleLoadScene(msg.id, (command as LoadSceneRequest).params);
          break;
        case 'saveScene':
          result = handleSaveScene(msg.id);
          break;
        case 'exportImage':
          result = await handleExportImage(msg.id, (command as ExportImageRequest).params);
          break;
        default:
          result = { type: 'error', id: msg.id, success: false, error: `Unknown command: ${msg.type}` };
      }

      window.canvasAPI.sendResult(result);
    });
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Excalidraw excalidrawAPI={(api) => { excalidrawAPIRef.current = api as unknown as ExcalidrawAPI; }} />
    </div>
  );
}
