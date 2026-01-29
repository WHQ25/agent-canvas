import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Excalidraw, convertToExcalidrawElements, exportToBlob, restoreElements, CaptureUpdateAction } from '@excalidraw/excalidraw';

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
  ResizeElementsParams,
  LoadSceneParams,
  ExportImageParams,
  SceneElement,
  CanvasMetadata,
  CanvasListState,
  CreateCanvasParams,
  SwitchCanvasParams,
  RenameCanvasParams,
} from './protocol';

import {
  loadCanvasList,
  saveCanvasList,
  loadCanvasScene,
  saveCanvasScene,
  deleteCanvasScene,
  createCanvas,
  updateCanvasTimestamp,
  findCanvasByName,
  isCanvasNameUnique,
  type CanvasSceneData,
} from './lib/canvas-storage';

import { CanvasSidebar } from './components/CanvasSidebar';

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
    captureUpdate?: 'IMMEDIATELY' | 'EVENTUALLY' | 'NEVER';
  }) => void;
}

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

// Filter appState to only save necessary keys
function filterAppState(appState: unknown): Record<string, unknown> {
  const state = appState as Record<string, unknown>;
  const filteredAppState: Record<string, unknown> = {};
  for (const key of APP_STATE_KEYS_TO_SAVE) {
    if (key in state) {
      filteredAppState[key] = state[key];
    }
  }
  return filteredAppState;
}

export default function App() {
  const excalidrawAPIRef = useRef<ExcalidrawAPI | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Canvas list state
  const [canvasListState, setCanvasListState] = useState<CanvasListState>(() => loadCanvasList());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Ref to track canvas list state for handlers (avoids stale closures)
  const canvasListStateRef = useRef(canvasListState);
  canvasListStateRef.current = canvasListState;

  // Scene cache for thumbnails (including current scene)
  const [sceneCache, setSceneCache] = useState<Map<string, CanvasSceneData | null>>(() => {
    const cache = new Map<string, CanvasSceneData | null>();
    const listState = loadCanvasList();
    for (const canvas of listState.canvases) {
      cache.set(canvas.id, loadCanvasScene(canvas.id));
    }
    return cache;
  });

  // Current canvas scene
  const currentScene = useMemo(() => {
    return sceneCache.get(canvasListState.activeCanvasId) || null;
  }, [sceneCache, canvasListState.activeCanvasId]);

  // Get theme from current scene
  const isDarkMode = useMemo(() => {
    const appState = currentScene?.appState as { theme?: string } | undefined;
    return appState?.theme === 'dark';
  }, [currentScene]);

  // Get canvas background color from current scene (raw value before dark mode filter)
  const canvasBackgroundColor = useMemo(() => {
    const appState = currentScene?.appState as { viewBackgroundColor?: string } | undefined;
    // Default is white - Excalidraw applies CSS filter in dark mode
    return appState?.viewBackgroundColor || '#ffffff';
  }, [currentScene]);

  // Save current canvas scene
  const saveCurrentScene = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    const state = canvasListStateRef.current;
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles();
    const filteredAppState = filterAppState(appState);

    const sceneData: CanvasSceneData = {
      elements: elements as unknown[],
      appState: filteredAppState,
      files,
    };

    saveCanvasScene(state.activeCanvasId, sceneData);

    // Update scene cache
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(state.activeCanvasId, sceneData);
      return next;
    });

    // Update timestamp in canvas list
    setCanvasListState(prev => {
      const updated = updateCanvasTimestamp(prev, state.activeCanvasId);
      saveCanvasList(updated);
      return updated;
    });
  }, []);

  // Handler: List canvases
  const handleListCanvases = useCallback((id: string) => {
    const state = canvasListStateRef.current;
    return {
      type: 'listCanvasesResult',
      id,
      success: true,
      activeCanvasId: state.activeCanvasId,
      canvases: state.canvases,
    };
  }, []);

  // Handler: Create canvas
  const handleCreateCanvas = useCallback((id: string, params: CreateCanvasParams) => {
    const state = canvasListStateRef.current;
    const api = excalidrawAPIRef.current;
    const name = params.name.trim();

    if (!name) {
      return { type: 'createCanvasResult', id, success: false, error: 'Canvas name cannot be empty' };
    }

    if (!isCanvasNameUnique(state, name)) {
      return { type: 'createCanvasResult', id, success: false, error: `Canvas "${name}" already exists` };
    }

    const newCanvas = createCanvas(name);

    // Save current scene before switching
    if (params.switchTo) {
      saveCurrentScene();
    }

    // Preserve current theme for new canvas
    const currentAppState = api?.getAppState() as { theme?: string } | undefined;
    const preservedAppState = { theme: currentAppState?.theme };

    // Update canvas list
    const updatedState: CanvasListState = {
      activeCanvasId: params.switchTo ? newCanvas.id : state.activeCanvasId,
      canvases: [...state.canvases, newCanvas],
    };

    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Initialize empty scene for new canvas with preserved theme
    const emptyScene: CanvasSceneData = { elements: [], appState: preservedAppState };
    saveCanvasScene(newCanvas.id, emptyScene);
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(newCanvas.id, emptyScene);
      return next;
    });

    // If switching, load empty scene (theme is preserved via appState)
    if (params.switchTo) {
      if (api) {
        api.updateScene({
          elements: [],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
    }

    return { type: 'createCanvasResult', id, success: true, canvas: newCanvas };
  }, [saveCurrentScene]);

  // Ref for debounce timeout - defined early so switch handlers can access it
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handler: Switch canvas
  const handleSwitchCanvas = useCallback((id: string, params: SwitchCanvasParams) => {
    const state = canvasListStateRef.current;
    const canvas = findCanvasByName(state, params.name);

    if (!canvas) {
      return { type: 'switchCanvasResult', id, success: false, error: `Canvas "${params.name}" not found` };
    }

    if (canvas.id === state.activeCanvasId) {
      return { type: 'switchCanvasResult', id, success: true, canvas };
    }

    // Cancel pending debounce to avoid saving to wrong canvas
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Save current scene
    saveCurrentScene();

    // Load target scene
    const targetScene = loadCanvasScene(canvas.id);
    const api = excalidrawAPIRef.current;
    if (api) {
      api.updateScene({
        elements: (targetScene?.elements as readonly unknown[]) || [],
        appState: targetScene?.appState,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }

    // Update active canvas
    const updatedState: CanvasListState = {
      ...state,
      activeCanvasId: canvas.id,
    };
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Update cache
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(canvas.id, targetScene);
      return next;
    });

    return { type: 'switchCanvasResult', id, success: true, canvas };
  }, [saveCurrentScene]);

  // Handler: Rename canvas (current canvas)
  const handleRenameCanvas = useCallback((id: string, params: RenameCanvasParams) => {
    const state = canvasListStateRef.current;
    const newName = params.newName.trim();

    if (!newName) {
      return { type: 'renameCanvasResult', id, success: false, error: 'Canvas name cannot be empty' };
    }

    if (!isCanvasNameUnique(state, newName, state.activeCanvasId)) {
      return { type: 'renameCanvasResult', id, success: false, error: `Canvas "${newName}" already exists` };
    }

    const updatedCanvases = state.canvases.map(c =>
      c.id === state.activeCanvasId
        ? { ...c, name: newName, updatedAt: Date.now() }
        : c
    );

    const updatedState: CanvasListState = {
      ...state,
      canvases: updatedCanvases,
    };
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    const renamedCanvas = updatedCanvases.find(c => c.id === state.activeCanvasId);
    return { type: 'renameCanvasResult', id, success: true, canvas: renamedCanvas };
  }, []);

  // UI handler: Select canvas from sidebar
  const handleSelectCanvas = useCallback((canvasId: string) => {
    const state = canvasListStateRef.current;
    if (canvasId === state.activeCanvasId) return;

    // Cancel pending debounce to avoid saving to wrong canvas
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Save current scene
    saveCurrentScene();

    // Load target scene
    const targetScene = loadCanvasScene(canvasId);
    const api = excalidrawAPIRef.current;
    if (api) {
      api.updateScene({
        elements: (targetScene?.elements as readonly unknown[]) || [],
        appState: targetScene?.appState,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }

    // Update active canvas
    const updatedState: CanvasListState = {
      ...state,
      activeCanvasId: canvasId,
    };
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Update cache
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(canvasId, targetScene);
      return next;
    });
  }, [saveCurrentScene]);

  // UI handler: Create canvas from sidebar
  const handleCreateCanvasUI = useCallback(() => {
    const state = canvasListStateRef.current;
    const api = excalidrawAPIRef.current;

    // Generate unique name
    let baseName = 'New Canvas';
    let counter = 1;
    let name = baseName;
    while (!isCanvasNameUnique(state, name)) {
      name = `${baseName} ${counter++}`;
    }

    const newCanvas = createCanvas(name);

    // Save current scene
    saveCurrentScene();

    // Preserve current theme for new canvas
    const currentAppState = api?.getAppState() as { theme?: string } | undefined;
    const preservedAppState = { theme: currentAppState?.theme };

    // Update canvas list
    const updatedState: CanvasListState = {
      activeCanvasId: newCanvas.id,
      canvases: [...state.canvases, newCanvas],
    };
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Initialize empty scene for new canvas with preserved theme
    const emptyScene: CanvasSceneData = { elements: [], appState: preservedAppState };
    saveCanvasScene(newCanvas.id, emptyScene);
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(newCanvas.id, emptyScene);
      return next;
    });

    // Clear canvas but keep theme
    if (api) {
      api.updateScene({
        elements: [],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }
  }, [saveCurrentScene]);

  // UI handler: Rename canvas from sidebar
  const handleRenameCanvasUI = useCallback((canvasId: string, newName: string) => {
    const state = canvasListStateRef.current;
    const trimmedName = newName.trim();
    if (!trimmedName || !isCanvasNameUnique(state, trimmedName, canvasId)) {
      return;
    }

    const updatedCanvases = state.canvases.map(c =>
      c.id === canvasId
        ? { ...c, name: trimmedName, updatedAt: Date.now() }
        : c
    );

    const updatedState: CanvasListState = {
      ...state,
      canvases: updatedCanvases,
    };
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);
  }, []);

  // UI handler: Delete canvas from sidebar
  const handleDeleteCanvasUI = useCallback((canvasId: string) => {
    const state = canvasListStateRef.current;
    // Can't delete the last canvas
    if (state.canvases.length <= 1) {
      return;
    }

    // Find next canvas to switch to
    const currentIndex = state.canvases.findIndex(c => c.id === canvasId);
    const nextCanvas = state.canvases[currentIndex === 0 ? 1 : currentIndex - 1];

    // If deleting active canvas, switch first
    if (canvasId === state.activeCanvasId) {
      const targetScene = loadCanvasScene(nextCanvas.id);
      const api = excalidrawAPIRef.current;
      if (api) {
        api.updateScene({
          elements: (targetScene?.elements as readonly unknown[]) || [],
          appState: targetScene?.appState,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
    }

    // Remove canvas from list
    const updatedCanvases = state.canvases.filter(c => c.id !== canvasId);
    const updatedState: CanvasListState = {
      activeCanvasId: canvasId === state.activeCanvasId ? nextCanvas.id : state.activeCanvasId,
      canvases: updatedCanvases,
    };
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Delete scene data
    deleteCanvasScene(canvasId);
    setSceneCache(prev => {
      const next = new Map(prev);
      next.delete(canvasId);
      return next;
    });
  }, []);

  // Handler functions for drawing commands
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
      const elementsToAdd = params.customData
        ? newElements.map(el => ({ ...el, customData: params.customData }))
        : newElements;
      api.updateScene({
        elements: [...elements, ...elementsToAdd],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

      const addedElement = api.getSceneElements().find(e => e.id === newElements[0].id);
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
        x: 0,
        y: 0,
        fontSize: params.fontSize ?? 20,
        textAlign: params.textAlign ?? 'left',
        strokeColor: params.strokeColor ?? '#1e1e1e',
        customData: params.customData,
      };

      const newElements = convertToExcalidrawElements([textSkeleton]);
      const textElement = newElements[0] as ExcalidrawElement;
      const width = textElement.width ?? 0;
      const height = textElement.height ?? 0;

      let offsetX = 0;
      let offsetY = 0;
      const anchor = params.anchor ?? 'bottomLeft';

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

      api.updateScene({
        elements: [...elements, ...elementsToAdd],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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
      const dx = params.endX - params.x;
      const dy = params.endY - params.y;

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
          points = [[0, 0]];
          for (const pt of params.midpoints) {
            points.push([pt.x - params.x, pt.y - params.y]);
          }
          points.push([dx, dy]);
        } else {
          points = [[0, 0], [dx, 0], [dx, dy]];
        }
      } else {
        points = [[0, 0], [dx, dy]];
      }

      const allX = points.map(p => p[0]);
      const allY = points.map(p => p[1]);
      const width = Math.max(...allX) - Math.min(...allX);
      const height = Math.max(...allY) - Math.min(...allY);

      if (params.arrowType === 'elbow' || params.arrowType === 'round') {
        const arrowId = Math.random().toString(36).substring(2, 15);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawArrow: any = {
          id: arrowId,
          type: 'arrow',
          x: params.x,
          y: params.y,
          width: width || Math.abs(dx),
          height: height || Math.abs(dy),
          points,
          strokeColor: params.strokeColor ?? '#1e1e1e',
          strokeWidth: params.strokeWidth ?? 2,
          strokeStyle: params.strokeStyle ?? 'solid',
          startArrowhead: params.startArrowhead ?? null,
          endArrowhead: params.endArrowhead ?? 'arrow',
          customData: params.customData,
          startBinding: null,
          endBinding: null,
          lastCommittedPoint: null,
        };

        if (params.arrowType === 'round') {
          rawArrow.roundness = { type: 2 };
          rawArrow.elbowed = false;
        } else if (params.arrowType === 'elbow') {
          rawArrow.elbowed = true;
          rawArrow.roundness = null;
          rawArrow.fixedSegments = [];
          rawArrow.startIsSpecial = false;
          rawArrow.endIsSpecial = false;
        }

        const restoredElements = restoreElements([rawArrow], null);

        api.updateScene({
          elements: [...elements, ...restoredElements],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });

        return { type: 'addArrowResult', id, success: true, elementId: arrowId };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arrowSkeleton: any = {
        type: 'arrow',
        x: params.x,
        y: params.y,
        points,
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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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

      const groupIds = new Set<string>();
      elements.forEach(e => {
        if (idsToRotate.has(e.id) && e.groupIds?.length) {
          e.groupIds.forEach(gid => groupIds.add(gid));
        }
      });

      const boundTextIds = new Set<string>();
      const elementAngles = new Map<string, number>();
      elements.forEach(e => {
        const shouldRotate = idsToRotate.has(e.id) ||
          (groupIds.size > 0 && e.groupIds?.some(gid => groupIds.has(gid)));
        if (shouldRotate && e.boundElements) {
          const newAngle = (e.angle ?? 0) + angleInRadians;
          for (const bound of e.boundElements) {
            if (bound.type === 'text') {
              boundTextIds.add(bound.id);
              elementAngles.set(bound.id, newAngle);
            }
          }
        }
      });

      const updatedElements = elements.map(e => {
        if (boundTextIds.has(e.id)) {
          return { ...e, angle: elementAngles.get(e.id) ?? e.angle };
        }

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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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
      const idsToMove = new Set(params.elementIds);

      for (const el of elements) {
        if (idsToMove.has(el.id) && el.boundElements) {
          for (const bound of el.boundElements) {
            idsToMove.add(bound.id);
          }
        }
      }

      const groupIds = new Set<string>();
      elements.forEach(e => {
        if (idsToMove.has(e.id) && e.groupIds?.length) {
          e.groupIds.forEach(gid => groupIds.add(gid));
        }
      });

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
          };
        }
        return e;
      });

      if (movedCount === 0) {
        return { type: 'moveElementsResult', id, success: false, error: 'No elements found' };
      }

      api.updateScene({
        elements: updatedElements,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

      return { type: 'moveElementsResult', id, success: true, movedCount };
    } catch (error) {
      return { type: 'moveElementsResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleResizeElements = useCallback((id: string, params: ResizeElementsParams) => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'resizeElementsResult', id, success: false, error: 'Canvas not ready' };
    }

    const { top = 0, bottom = 0, left = 0, right = 0 } = params;

    if (top === 0 && bottom === 0 && left === 0 && right === 0) {
      return { type: 'resizeElementsResult', id, success: false, error: 'At least one resize parameter (top, bottom, left, right) must be non-zero' };
    }

    try {
      const elements = api.getSceneElements();
      const idsToResize = new Set(params.elementIds);
      const SHAPE_TYPES = ['rectangle', 'ellipse', 'diamond'];
      const BOUND_TEXT_PADDING = 5;

      for (const el of elements) {
        if (idsToResize.has(el.id) && !SHAPE_TYPES.includes(el.type)) {
          return { type: 'resizeElementsResult', id, success: false, error: `Element ${el.id} is not a shape (type: ${el.type}). Only rectangle, ellipse, and diamond are supported.` };
        }
      }

      const updatedContainers = new Map<string, { x: number; y: number; width: number; height: number; type: string }>();

      let resizedCount = 0;
      let updatedElements = elements.map(e => {
        if (!idsToResize.has(e.id)) {
          return e;
        }

        const width = e.width ?? 100;
        const height = e.height ?? 100;
        const angle = e.angle ?? 0;

        const newWidth = width + left + right;
        const newHeight = height + top + bottom;

        if (newWidth <= 0) {
          return { error: `Resulting width (${newWidth}) would be <= 0` };
        }
        if (newHeight <= 0) {
          return { error: `Resulting height (${newHeight}) would be <= 0` };
        }

        const localDeltaX = -left;
        const localDeltaY = -top;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const globalDeltaX = localDeltaX * cos - localDeltaY * sin;
        const globalDeltaY = localDeltaX * sin + localDeltaY * cos;

        const newX = e.x + globalDeltaX;
        const newY = e.y + globalDeltaY;

        updatedContainers.set(e.id, { x: newX, y: newY, width: newWidth, height: newHeight, type: e.type });

        resizedCount++;
        return {
          ...e,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };
      });

      for (const el of updatedElements) {
        if ('error' in el) {
          return { type: 'resizeElementsResult', id, success: false, error: el.error as string };
        }
      }

      if (resizedCount === 0) {
        return { type: 'resizeElementsResult', id, success: false, error: 'No elements found' };
      }

      updatedElements = updatedElements.map(e => {
        if (e.type !== 'text' || !('containerId' in e) || !e.containerId) {
          return e;
        }

        const container = updatedContainers.get(e.containerId);
        if (!container) {
          return e;
        }

        const textWidth = e.width ?? 0;
        const textHeight = e.height ?? 0;

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

        const newTextX = container.x + offsetX + (maxWidth - textWidth) / 2;
        const newTextY = container.y + offsetY + (maxHeight - textHeight) / 2;

        return {
          ...e,
          x: newTextX,
          y: newTextY,
        };
      });

      api.updateScene({
        elements: updatedElements as ExcalidrawElement[],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });

      return { type: 'resizeElementsResult', id, success: true, resizedCount };
    } catch (error) {
      return { type: 'resizeElementsResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const handleReadScene = useCallback((id: string) => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'readSceneResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState() as { selectedElementIds?: Record<string, true> };
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

      const selectedElementIds = appState.selectedElementIds
        ? Object.keys(appState.selectedElementIds)
        : [];

      return { type: 'readSceneResult', id, success: true, elements: sceneElements, selectedElementIds };
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
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
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

  const handleClearCanvas = useCallback((id: string) => {
    const api = excalidrawAPIRef.current;
    if (!api) {
      return { type: 'clearCanvasResult', id, success: false, error: 'Canvas not ready' };
    }

    try {
      api.updateScene({
        elements: [],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      return { type: 'clearCanvasResult', id, success: true };
    } catch (error) {
      return { type: 'clearCanvasResult', id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
      case 'listCanvases':
        return handleListCanvases(command.id);
      case 'createCanvas':
        return handleCreateCanvas(command.id, command.params as CreateCanvasParams);
      case 'switchCanvas':
        return handleSwitchCanvas(command.id, command.params as SwitchCanvasParams);
      case 'renameCanvas':
        return handleRenameCanvas(command.id, command.params as RenameCanvasParams);
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
      case 'resizeElements':
        return handleResizeElements(command.id, command.params as ResizeElementsParams);
      case 'readScene':
        return handleReadScene(command.id);
      case 'loadScene':
        return handleLoadScene(command.id, command.params as LoadSceneParams);
      case 'saveScene':
        return handleSaveScene(command.id);
      case 'exportImage':
        return await handleExportImage(command.id, command.params as ExportImageParams);
      case 'clearCanvas':
        return handleClearCanvas(command.id);
      default:
        return { type: 'error', id: command.id, success: false, error: `Unknown command: ${command.type}` };
    }
  }, [
    handleListCanvases, handleCreateCanvas, handleSwitchCanvas, handleRenameCanvas,
    handleAddShape, handleAddText, handleAddLine, handleAddArrow, handleAddPolygon,
    handleDeleteElements, handleRotateElements, handleGroupElements, handleUngroupElement,
    handleMoveElements, handleResizeElements, handleReadScene, handleLoadScene, handleSaveScene,
    handleExportImage, handleClearCanvas,
  ]);

  // WebSocket connection
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to server');
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

  // Debounced scene save and thumbnail update
  // Use ref to track active canvas ID for debounced save (avoids stale closure)
  const activeCanvasIdRef = useRef(canvasListState.activeCanvasId);
  activeCanvasIdRef.current = canvasListState.activeCanvasId;

  const handleChange = useCallback(() => {
    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      // Read current state from API (not from closure) to avoid stale data
      const activeId = activeCanvasIdRef.current;
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();
      const filteredAppState = filterAppState(appState);

      const sceneData: CanvasSceneData = {
        elements: elements as unknown[],
        appState: filteredAppState,
        files,
      };

      saveCanvasScene(activeId, sceneData);

      // Update scene cache for thumbnail
      setSceneCache(prev => {
        const next = new Map(prev);
        next.set(activeId, sceneData);
        return next;
      });

      // Update timestamp - use functional update to get latest state
      setCanvasListState(prev => {
        const updated = updateCanvasTimestamp(prev, activeId);
        saveCanvasList(updated);
        return updated;
      });
    }, 500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <CanvasSidebar
        canvases={canvasListState.canvases}
        activeCanvasId={canvasListState.activeCanvasId}
        scenes={sceneCache}
        isDarkMode={isDarkMode}
        canvasBackgroundColor={canvasBackgroundColor}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectCanvas={handleSelectCanvas}
        onCreateCanvas={handleCreateCanvasUI}
        onRenameCanvas={handleRenameCanvasUI}
        onDeleteCanvas={handleDeleteCanvasUI}
      />
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawAPIRef.current = api as unknown as ExcalidrawAPI; }}
          initialData={currentScene ? { elements: currentScene.elements as never[], appState: currentScene.appState } : undefined}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
