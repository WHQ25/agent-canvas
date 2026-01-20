import { useEffect, useRef, useCallback, useState } from 'react';
import { Excalidraw, convertToExcalidrawElements, exportToBlob } from '@excalidraw/excalidraw';

const STORAGE_KEY = 'agent-canvas-scene';
import type {
  AddShapeParams,
  AddTextParams,
  AddLineParams,
  AddArrowParams,
  AddPolygonParams,
  DeleteElementsParams,
  RotateElementsParams,
  GroupElementsParams,
  UngroupElementParams,
  MoveElementsParams,
  LoadSceneParams,
  ExportImageParams,
  SceneElement,
} from './protocol';

const WS_PORT = 7890;

interface BoundElementRef {
  id: string;
  type: 'arrow' | 'text';
}

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
  text?: string;
  fontSize?: number;
  containerId?: string | null;
  boundElements?: readonly BoundElementRef[] | null;
  points?: number[][];
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  customData?: Record<string, unknown>;
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

// Load saved scene from localStorage
const loadSavedScene = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        elements: data.elements || [],
        appState: data.appState || {},
      };
    }
  } catch (error) {
    console.error('Failed to load saved scene:', error);
  }
  return null;
};

// AppState keys to save (matching Excalidraw's browser: true config)
const APP_STATE_KEYS_TO_SAVE = [
  'showWelcomeScreen',
  'theme',
  'currentChartType',
  'currentItemBackgroundColor',
  'currentItemEndArrowhead',
  'currentItemFillStyle',
  'currentItemFontFamily',
  'currentItemFontSize',
  'currentItemOpacity',
  'currentItemRoughness',
  'currentItemStartArrowhead',
  'currentItemStrokeColor',
  'currentItemStrokeStyle',
  'currentItemStrokeWidth',
  'currentItemTextAlign',
  'currentItemRoundness',
  'currentItemArrowType',
  'cursorButton',
  'editingGroupId',
  'activeTool',
  'penMode',
  'penDetected',
  'exportBackground',
  'exportEmbedScene',
  'exportScale',
  'exportWithDarkMode',
  'gridSize',
  'gridStep',
  'gridModeEnabled',
  'defaultSidebarDockedPreference',
  'lastPointerDownWith',
  'name',
  'openMenu',
  'openSidebar',
  'previousSelectedElementIds',
  'scrolledOutside',
  'scrollX',
  'scrollY',
  'selectedElementIds',
  'selectedGroupIds',
  'shouldCacheIgnoreZoom',
  'stats',
  'viewBackgroundColor',
  'zenModeEnabled',
  'zoom',
  'selectedLinearElement',
  'objectsSnapModeEnabled',
] as const;

// Save scene to localStorage
const saveScene = (elements: readonly unknown[], appState: unknown) => {
  try {
    const state = appState as Record<string, unknown>;
    const filteredAppState: Record<string, unknown> = {};
    for (const key of APP_STATE_KEYS_TO_SAVE) {
      if (key in state) {
        filteredAppState[key] = state[key];
      }
    }
    const data = { elements, appState: filteredAppState };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save scene:', error);
  }
};

export default function App() {
  const excalidrawAPIRef = useRef<ExcalidrawAPI | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [initialData] = useState(loadSavedScene);

  // Handler functions
  const handleAddShape = useCallback((id: string, params: AddShapeParams) => {
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
      // Merge customData into converted element (convertToExcalidrawElements may not preserve it)
      const elementsToAdd = params.customData
        ? newElements.map(el => ({ ...el, customData: params.customData }))
        : newElements;
      api.updateScene({
        elements: [...elements, ...elementsToAdd],
        captureUpdate: 'immediately',
      });

      return { type: 'addShapeResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addShapeResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleAddText = useCallback((id: string, params: AddTextParams) => {
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
        customData: params.customData,
      };

      const newElements = convertToExcalidrawElements([textSkeleton]);
      const elementsToAdd = params.customData
        ? newElements.map(el => ({ ...el, customData: params.customData }))
        : newElements;
      api.updateScene({
        elements: [...elements, ...elementsToAdd],
        captureUpdate: 'immediately',
      });

      return { type: 'addTextResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addTextResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleAddLine = useCallback((id: string, params: AddLineParams) => {
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
        customData: params.customData,
      };

      const newElements = convertToExcalidrawElements([lineSkeleton]);
      const elementsToAdd = params.customData
        ? newElements.map(el => ({ ...el, customData: params.customData }))
        : newElements;
      api.updateScene({
        elements: [...elements, ...elementsToAdd],
        captureUpdate: 'immediately',
      });

      return { type: 'addLineResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addLineResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleAddArrow = useCallback((id: string, params: AddArrowParams) => {
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
        customData: params.customData,
      };

      const newElements = convertToExcalidrawElements([arrowSkeleton]);
      const elementsToAdd = params.customData
        ? newElements.map(el => ({ ...el, customData: params.customData }))
        : newElements;
      api.updateScene({
        elements: [...elements, ...elementsToAdd],
        captureUpdate: 'immediately',
      });

      return { type: 'addArrowResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addArrowResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleAddPolygon = useCallback((id: string, params: AddPolygonParams) => {
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
        customData: params.customData,
      };

      const newElements = convertToExcalidrawElements([polygonSkeleton]);
      const elementsToAdd = params.customData
        ? newElements.map(el => ({ ...el, customData: params.customData }))
        : newElements;
      api.updateScene({
        elements: [...elements, ...elementsToAdd],
        captureUpdate: 'immediately',
      });

      return { type: 'addPolygonResult', id, success: true, elementId: newElements[0].id };
    } catch (error) {
      return { type: 'addPolygonResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleDeleteElements = useCallback((id: string, params: DeleteElementsParams) => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'deleteElementsResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
      const idsToDelete = new Set(params.elementIds);

      // Also delete bound elements (labels) of shapes being deleted
      for (const el of elements) {
        if (idsToDelete.has(el.id) && el.boundElements) {
          for (const bound of el.boundElements) {
            idsToDelete.add(bound.id);
          }
        }
      }

      let deletedCount = 0;

      const updatedElements = elements.map(e => {
        if (idsToDelete.has(e.id)) {
          deletedCount++;
          return { ...e, isDeleted: true };
        }
        return e;
      });

      if (deletedCount === 0) {
        return { type: 'deleteElementsResult', id, success: false, error: 'No elements found' };
      }

      api.updateScene({
        elements: updatedElements,
        captureUpdate: 'immediately',
      });

      return { type: 'deleteElementsResult', id, success: true, deletedCount };
    } catch (error) {
      return { type: 'deleteElementsResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleRotateElements = useCallback((id: string, params: RotateElementsParams) => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'rotateElementsResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
      const idsToRotate = new Set(params.elementIds);
      const angleInRadians = (params.angle * Math.PI) / 180;
      let rotatedCount = 0;

      // Collect all group IDs from the target elements
      const groupIds = new Set<string>();
      elements.forEach(e => {
        if (idsToRotate.has(e.id) && e.groupIds?.length) {
          e.groupIds.forEach(gid => groupIds.add(gid));
        }
      });

      const updatedElements = elements.map(e => {
        const shouldRotate = idsToRotate.has(e.id) ||
          (groupIds.size > 0 && e.groupIds?.some(gid => groupIds.has(gid)));

        if (shouldRotate) {
          rotatedCount++;
          return { ...e, angle: (e.angle ?? 0) + angleInRadians };
        }
        return e;
      });

      if (rotatedCount === 0) {
        return { type: 'rotateElementsResult', id, success: false, error: 'No elements found' };
      }

      api.updateScene({
        elements: updatedElements,
        captureUpdate: 'immediately',
      });

      return { type: 'rotateElementsResult', id, success: true, rotatedCount };
    } catch (error) {
      return { type: 'rotateElementsResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleGroupElements = useCallback((id: string, params: GroupElementsParams) => {
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
  }, []);

  const handleUngroupElement = useCallback((id: string, params: UngroupElementParams) => {
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
  }, []);

  const handleMoveElements = useCallback((id: string, params: MoveElementsParams) => {
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
  }, []);

  const handleReadScene = useCallback((id: string) => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'readSceneResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
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
          customData: e.customData,
        }));

      return { type: 'readSceneResult', id, success: true, elements: sceneElements };
    } catch (error) {
      return { type: 'readSceneResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleLoadScene = useCallback((id: string, params: LoadSceneParams) => {
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
  }, []);

  const handleSaveScene = useCallback((id: string) => {
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
  }, []);

  const handleExportImage = useCallback(async (id: string, params?: ExportImageParams) => {
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
  }, []);

  // Process incoming commands
  const processCommand = useCallback(async (command: { type: string; id: string; params?: unknown }) => {
    switch (command.type) {
      case 'addShape':
        return handleAddShape(command.id, command.params as AddShapeParams);
      case 'addText':
        return handleAddText(command.id, command.params as AddTextParams);
      case 'addLine':
        return handleAddLine(command.id, command.params as AddLineParams);
      case 'addArrow':
        return handleAddArrow(command.id, command.params as AddArrowParams);
      case 'addPolygon':
        return handleAddPolygon(command.id, command.params as AddPolygonParams);
      case 'deleteElements':
        return handleDeleteElements(command.id, command.params as DeleteElementsParams);
      case 'rotateElements':
        return handleRotateElements(command.id, command.params as RotateElementsParams);
      case 'groupElements':
        return handleGroupElements(command.id, command.params as GroupElementsParams);
      case 'ungroupElement':
        return handleUngroupElement(command.id, command.params as UngroupElementParams);
      case 'moveElements':
        return handleMoveElements(command.id, command.params as MoveElementsParams);
      case 'readScene':
        return handleReadScene(command.id);
      case 'loadScene':
        return handleLoadScene(command.id, command.params as LoadSceneParams);
      case 'saveScene':
        return handleSaveScene(command.id);
      case 'exportImage':
        return await handleExportImage(command.id, command.params as ExportImageParams);
      default:
        return { type: 'error', id: command.id, success: false, error: `Unknown command: ${command.type}` };
    }
  }, [
    handleAddShape, handleAddText, handleAddLine, handleAddArrow, handleAddPolygon,
    handleDeleteElements, handleRotateElements, handleGroupElements, handleUngroupElement,
    handleMoveElements, handleReadScene, handleLoadScene, handleSaveScene, handleExportImage,
  ]);

  // WebSocket connection
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to server');
        // Send browser identification
        ws.send(JSON.stringify({ type: 'browserConnect' }));
      };

      ws.onmessage = async (event) => {
        try {
          const command = JSON.parse(event.data);
          if (command.type && command.id) {
            const result = await processCommand(command);
            ws.send(JSON.stringify(result));
          }
        } catch (error) {
          console.error('Error processing command:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from server, reconnecting...');
        wsRef.current = null;
        setTimeout(connect, 1000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [processCommand]);

  // Save on change (debounced by Excalidraw internally)
  const handleChange = useCallback((elements: readonly unknown[], appState: unknown) => {
    saveScene(elements, appState);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Excalidraw
        excalidrawAPI={(api) => { excalidrawAPIRef.current = api as unknown as ExcalidrawAPI; }}
        initialData={initialData || undefined}
        onChange={handleChange}
      />
    </div>
  );
}
