import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Excalidraw, exportToBlob, CaptureUpdateAction } from '@excalidraw/excalidraw';

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
  CanvasListState,
  CanvasMetadata,
  CreateCanvasParams,
  SwitchCanvasParams,
  RenameCanvasParams,
  CreateFolderParams,
  DeleteFolderParams,
  MoveCanvasToFolderParams,
} from './protocol';

import type { HandlerDeps, HandlerContext } from './lib/handler-types';
import {
  handleAddShape as addShapeHandler,
  handleAddText as addTextHandler,
  handleAddLine as addLineHandler,
  handleAddArrow as addArrowHandler,
  handleAddPolygon as addPolygonHandler,
  handleAddImage as addImageHandler,
  handleDeleteElements as deleteElementsHandler,
  handleRotateElements as rotateElementsHandler,
  handleGroupElements as groupElementsHandler,
  handleUngroupElement as ungroupElementHandler,
  handleMoveElements as moveElementsHandler,
  handleResizeElements as resizeElementsHandler,
  handleReadScene as readSceneHandler,
  handleLoadScene as loadSceneHandler,
  handleSaveScene as saveSceneHandler,
  handleClearCanvas as clearCanvasHandler,
  handleExportImage as exportImageHandler,
} from './lib/message-handlers';

import {
  loadCanvasList,
  saveCanvasList,
  loadCanvasScene,
  saveCanvasScene,
  deleteCanvasScene,
  createCanvas,
  updateCanvasTimestamp,
  isCanvasNameUnique,
  loadAllScenes,
  loadFilesForCanvas,
  validateCreateCanvas,
  addCanvasToState,
  validateSwitchCanvas,
  validateRenameCanvas,
  renameCanvasInState,
  generateUniqueCanvasName,
  createCategory,
  renameCategory,
  deleteCategory,
  toggleCategoryCollapse,
  moveCanvasToCategory,
  removeCanvasFromCategoryMap,
  type CanvasSceneData,
} from './lib/canvas-storage';
import { collectUsedFiles } from './lib/file-utils';

import { CanvasSidebar } from './components/CanvasSidebar';

const WS_PORT = import.meta.env.VITE_WS_PORT ? parseInt(import.meta.env.VITE_WS_PORT, 10) : 7890;

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
  fileId?: string | null;
  customData?: Record<string, unknown>;
}

interface BinaryFileData {
  mimeType: string;
  id: string;
  dataURL: string;
  created: number;
}

interface ExcalidrawAPI {
  getSceneElements: () => readonly ExcalidrawElement[];
  getSceneElementsIncludingDeleted: () => readonly ExcalidrawElement[];
  getAppState: () => unknown;
  getFiles: () => unknown;
  updateScene: (scene: {
    elements?: readonly unknown[];
    appState?: unknown;
    captureUpdate?: 'IMMEDIATELY' | 'EVENTUALLY' | 'NEVER';
  }) => void;
  addFiles: (files: BinaryFileData[]) => void;
  scrollToContent: (target?: unknown, opts?: { fitToViewport?: boolean; viewportZoomFactor?: number; animate?: boolean; duration?: number; maxZoom?: number }) => void;
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
  // User instance - for user browsing/editing
  const excalidrawAPIRef = useRef<ExcalidrawAPI | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Canvas list state (user's active canvas)
  const [canvasListState, setCanvasListState] = useState<CanvasListState>(() => loadCanvasList());
  // Agent's active canvas (separate from user)
  const [agentActiveCanvasId, setAgentActiveCanvasId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to track canvas list state for handlers (avoids stale closures)
  const canvasListStateRef = useRef(canvasListState);
  canvasListStateRef.current = canvasListState;

  // Ref to track agent's active canvas
  const agentActiveCanvasIdRef = useRef(agentActiveCanvasId);
  agentActiveCanvasIdRef.current = agentActiveCanvasId;

  // Scene cache for thumbnails (including current scene)
  const [sceneCache, setSceneCache] = useState<Map<string, CanvasSceneData | null>>(new Map());

  // Load all scenes from IndexedDB on mount
  useEffect(() => {
    const initScenes = async () => {
      const listState = loadCanvasList();
      const cache = await loadAllScenes(listState.canvases);
      setSceneCache(cache);
      setIsLoading(false);
    };
    initScenes();
  }, []);

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

  // Helper to save scene to storage and sync to user if user is viewing that canvas
  const saveAndSyncScene = useCallback(async (
    canvasId: string,
    elements: unknown[],
    files?: unknown
  ) => {
    // Load existing scene to preserve user's appState (scroll, zoom, theme, etc.)
    const existingScene = await loadCanvasScene(canvasId);
    const existingAppState = existingScene?.appState || {};
    const existingFiles = files === undefined
      ? await loadFilesForCanvas(canvasId)
      : files;

    const sceneData: CanvasSceneData = {
      elements,
      appState: existingAppState,
      files: existingFiles,
    };

    await saveCanvasScene(canvasId, sceneData);

    // Update scene cache for thumbnail (filter deleted elements for display)
    const visibleElements = (elements as Array<{ isDeleted?: boolean }>).filter(e => !e.isDeleted);
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(canvasId, { ...sceneData, elements: visibleElements });
      return next;
    });

    // If user is viewing this canvas, sync to user's instance
    if (canvasId === activeCanvasIdRef.current && excalidrawAPIRef.current) {
      const userApi = excalidrawAPIRef.current;
      // Add files if present
      if (existingFiles && Object.keys(existingFiles as object).length > 0) {
        const filesArray = Object.values(existingFiles as Record<string, BinaryFileData>);
        userApi.addFiles(filesArray);
      }
      userApi.updateScene({
        elements: elements as readonly unknown[],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }

    // Update timestamp
    setCanvasListState(prev => {
      const updated = updateCanvasTimestamp(prev, canvasId);
      saveCanvasList(updated);
      return updated;
    });
  }, []);

  // Save current canvas scene (user instance)
  const saveCurrentScene = useCallback(async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    const state = canvasListStateRef.current;
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const allFiles = api.getFiles() as Record<string, BinaryFileData>;
    const files = collectUsedFiles(
      elements as Array<{ type?: string; fileId?: string; isDeleted?: boolean }>,
      allFiles
    );
    const filteredAppState = filterAppState(appState);

    const sceneData: CanvasSceneData = {
      elements: elements as unknown[],
      appState: filteredAppState,
      files,
    };

    await saveCanvasScene(state.activeCanvasId, sceneData);

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
      agentActiveCanvasId: agentActiveCanvasIdRef.current,
      canvases: state.canvases,
      categories: state.categories,
      canvasCategoryMap: state.canvasCategoryMap,
    };
  }, []);

  // Handler: Create canvas
  const handleCreateCanvas = useCallback(async (id: string, params: CreateCanvasParams) => {
    const state = canvasListStateRef.current;
    const api = excalidrawAPIRef.current;

    // Validate using pure function
    const validation = validateCreateCanvas(state, params.name);
    if (!validation.valid) {
      return { type: 'createCanvasResult', id, success: false, error: validation.error };
    }

    const newCanvas = createCanvas(params.name.trim());

    // Preserve current theme for new canvas, set name
    const currentAppState = api?.getAppState() as { theme?: string } | undefined;
    const preservedAppState = { theme: currentAppState?.theme, name: newCanvas.name };

    // Update canvas list using pure function
    const updatedState = addCanvasToState(state, newCanvas);
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Initialize empty scene for new canvas with preserved theme and name
    const emptyScene: CanvasSceneData = { elements: [], appState: preservedAppState };
    await saveCanvasScene(newCanvas.id, emptyScene);
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(newCanvas.id, emptyScene);
      return next;
    });

    // If switchTo, set agent's active canvas to the new canvas
    if (params.switchTo) {
      setAgentActiveCanvasId(newCanvas.id);
    }

    return { type: 'createCanvasResult', id, success: true, canvas: newCanvas };
  }, []);

  // Ref for debounce timeout - defined early so switch handlers can access it
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handler: Switch canvas (CLI command - switches agent's target canvas)
  const handleSwitchCanvas = useCallback(async (id: string, params: SwitchCanvasParams) => {
    const state = canvasListStateRef.current;

    // Validate using pure function
    const validation = validateSwitchCanvas(state, params.name, agentActiveCanvasIdRef.current);
    if (!validation.valid) {
      return { type: 'switchCanvasResult', id, success: false, error: validation.error };
    }

    // If already on this canvas, return early
    if (validation.alreadyActive) {
      return { type: 'switchCanvasResult', id, success: true, canvas: validation.canvas };
    }

    // Simply update agent's target canvas - no persistent instance to manage
    setAgentActiveCanvasId(validation.canvas!.id);

    return { type: 'switchCanvasResult', id, success: true, canvas: validation.canvas };
  }, []);

  // Handler: Rename canvas (current canvas)
  const handleRenameCanvas = useCallback((id: string, params: RenameCanvasParams) => {
    const state = canvasListStateRef.current;
    const targetCanvasId = agentActiveCanvasIdRef.current ?? state.activeCanvasId;

    // Validate using pure function
    const validation = validateRenameCanvas(state, params.newName, targetCanvasId);
    if (!validation.valid) {
      return { type: 'renameCanvasResult', id, success: false, error: validation.error };
    }

    // Rename using pure function
    const { state: updatedState, canvas: renamedCanvas } = renameCanvasInState(
      state,
      targetCanvasId,
      params.newName
    );
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Sync to Excalidraw appState.name
    const api = excalidrawAPIRef.current;
    if (api && renamedCanvas && targetCanvasId === state.activeCanvasId) {
      api.updateScene({ appState: { name: renamedCanvas.name } });
    }

    return { type: 'renameCanvasResult', id, success: true, canvas: renamedCanvas };
  }, []);

  // Handler: Create folder
  const handleCreateFolder = useCallback((id: string, params: CreateFolderParams) => {
    const state = canvasListStateRef.current;
    const name = params.name.trim();
    if (!name) {
      return { type: 'createFolderResult', id, success: false, error: 'Folder name cannot be empty' };
    }
    const existing = (state.categories || []).find(c => c.name === name);
    if (existing) {
      return { type: 'createFolderResult', id, success: false, error: `Folder "${name}" already exists` };
    }
    const updatedState = createCategory(state, name);
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);
    const newCategory = (updatedState.categories || []).find(c => c.name === name);
    return { type: 'createFolderResult', id, success: true, category: newCategory };
  }, []);

  // Handler: Delete folder
  const handleDeleteFolder = useCallback((id: string, params: DeleteFolderParams) => {
    const state = canvasListStateRef.current;
    const name = params.name.trim();
    const category = (state.categories || []).find(c => c.name === name);
    if (!category) {
      return { type: 'deleteFolderResult', id, success: false, error: `Folder "${name}" not found` };
    }
    const updatedState = deleteCategory(state, category.id);
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);
    return { type: 'deleteFolderResult', id, success: true };
  }, []);

  // Handler: Move canvas to folder
  const handleMoveCanvasToFolder = useCallback((id: string, params: MoveCanvasToFolderParams) => {
    const state = canvasListStateRef.current;
    const canvas = state.canvases.find(c => c.name === params.canvasName);
    if (!canvas) {
      return { type: 'moveCanvasToFolderResult', id, success: false, error: `Canvas "${params.canvasName}" not found` };
    }
    let categoryId: string | null = null;
    if (params.folderName !== null) {
      const category = (state.categories || []).find(c => c.name === params.folderName);
      if (!category) {
        return { type: 'moveCanvasToFolderResult', id, success: false, error: `Folder "${params.folderName}" not found` };
      }
      categoryId = category.id;
    }
    const updatedState = moveCanvasToCategory(state, canvas.id, categoryId);
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);
    return { type: 'moveCanvasToFolderResult', id, success: true };
  }, []);

  // UI handler: Select canvas from sidebar
  const handleSelectCanvas = useCallback(async (canvasId: string) => {
    const state = canvasListStateRef.current;
    if (canvasId === state.activeCanvasId) return;

    // Cancel pending debounce to avoid saving to wrong canvas
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Save current scene
    await saveCurrentScene();

    // Load target scene
    const targetScene = await loadCanvasScene(canvasId);
    const files = await loadFilesForCanvas(canvasId);
    const api = excalidrawAPIRef.current;
    if (api) {
      // Load files first if present
      if (Object.keys(files).length > 0) {
        const filesArray = Object.values(files);
        api.addFiles(filesArray);
      }
      api.updateScene({
        elements: (targetScene?.elements as readonly unknown[]) || [],
        appState: targetScene?.appState,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }

    // Update cache first (include files in scene for cache)
    const sceneWithFiles = targetScene ? { ...targetScene, files } : null;
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(canvasId, sceneWithFiles);
      return next;
    });

    // Then update active canvas (preserves categories via spread)
    setCanvasListState(prev => {
      const updated = { ...prev, activeCanvasId: canvasId };
      saveCanvasList(updated);
      return updated;
    });
  }, [saveCurrentScene]);

  // UI handler: Create canvas from sidebar
  const handleCreateCanvasUI = useCallback(async () => {
    const state = canvasListStateRef.current;
    const api = excalidrawAPIRef.current;

    // Generate unique name using pure function
    const name = generateUniqueCanvasName(state, 'New Canvas');
    const newCanvas = createCanvas(name);

    // Save current scene
    await saveCurrentScene();

    // Preserve current theme for new canvas, set name
    const currentAppState = api?.getAppState() as { theme?: string } | undefined;
    const preservedAppState = { theme: currentAppState?.theme, name: newCanvas.name };

    // Update canvas list (preserve categories)
    const updatedState: CanvasListState = {
      ...state,
      activeCanvasId: newCanvas.id,
      canvases: [...state.canvases, newCanvas],
    };
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Initialize empty scene for new canvas with preserved theme and name
    const emptyScene: CanvasSceneData = { elements: [], appState: preservedAppState };
    await saveCanvasScene(newCanvas.id, emptyScene);
    setSceneCache(prev => {
      const next = new Map(prev);
      next.set(newCanvas.id, emptyScene);
      return next;
    });

    // Clear canvas but keep theme, set name
    if (api) {
      api.updateScene({
        elements: [],
        appState: { name: newCanvas.name },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }
  }, [saveCurrentScene]);

  // UI handler: Rename canvas from sidebar
  const handleRenameCanvasUI = useCallback((canvasId: string, newName: string) => {
    const state = canvasListStateRef.current;

    // Validate using pure function
    const validation = validateRenameCanvas(state, newName, canvasId);
    if (!validation.valid) {
      return;
    }

    // Rename using pure function
    const { state: updatedState, canvas: renamedCanvas } = renameCanvasInState(state, canvasId, newName);
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Sync to Excalidraw appState.name if renaming active canvas
    if (canvasId === state.activeCanvasId && renamedCanvas) {
      const api = excalidrawAPIRef.current;
      if (api) {
        api.updateScene({ appState: { name: renamedCanvas.name } });
      }
    }
  }, []);

  // UI handler: Delete canvas from sidebar
  const handleDeleteCanvasUI = useCallback(async (canvasId: string) => {
    const state = canvasListStateRef.current;
    const api = excalidrawAPIRef.current;
    const isLastCanvas = state.canvases.length <= 1;

    let nextCanvas: CanvasMetadata;

    if (isLastCanvas) {
      // Create a new canvas with unique name using pure function
      const name = generateUniqueCanvasName(state, 'New Canvas', canvasId);
      nextCanvas = createCanvas(name);
      // Preserve current theme
      const currentAppState = api?.getAppState() as { theme?: string } | undefined;
      const preservedAppState = { theme: currentAppState?.theme, name: nextCanvas.name };
      const emptyScene: CanvasSceneData = { elements: [], appState: preservedAppState };
      await saveCanvasScene(nextCanvas.id, emptyScene);
      setSceneCache(prev => {
        const next = new Map(prev);
        next.set(nextCanvas.id, emptyScene);
        return next;
      });
    } else {
      // Find next canvas to switch to
      const currentIndex = state.canvases.findIndex(c => c.id === canvasId);
      nextCanvas = state.canvases[currentIndex === 0 ? 1 : currentIndex - 1];
    }

    if (agentActiveCanvasIdRef.current === canvasId) {
      setAgentActiveCanvasId(nextCanvas.id);
    }

    // If deleting active canvas, switch first
    if (canvasId === state.activeCanvasId) {
      const targetScene = await loadCanvasScene(nextCanvas.id);
      const files = await loadFilesForCanvas(nextCanvas.id);
      if (api) {
        // Load files first if present
        if (Object.keys(files).length > 0) {
          const filesArray = Object.values(files);
          api.addFiles(filesArray);
        }
        api.updateScene({
          elements: (targetScene?.elements as readonly unknown[]) || [],
          appState: targetScene?.appState,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
    }

    // Build updated canvas list, preserving categories and cleaning up category map
    const remainingCanvases = state.canvases.filter(c => c.id !== canvasId);
    const updatedCanvases = isLastCanvas ? [nextCanvas] : remainingCanvases;
    let updatedState: CanvasListState = {
      ...state,
      activeCanvasId: canvasId === state.activeCanvasId ? nextCanvas.id : state.activeCanvasId,
      canvases: updatedCanvases,
    };
    // Clean up category mapping for deleted canvas
    updatedState = removeCanvasFromCategoryMap(updatedState, canvasId);
    setCanvasListState(updatedState);
    saveCanvasList(updatedState);

    // Delete scene data
    await deleteCanvasScene(canvasId);
    setSceneCache(prev => {
      const next = new Map(prev);
      next.delete(canvasId);
      return next;
    });
  }, []);

  // Category handlers
  const handleCreateCategoryUI = useCallback(() => {
    setCanvasListState(prev => {
      const updated = createCategory(prev, 'New Category');
      saveCanvasList(updated);
      return updated;
    });
  }, []);

  const handleRenameCategoryUI = useCallback((categoryId: string, newName: string) => {
    setCanvasListState(prev => {
      const updated = renameCategory(prev, categoryId, newName);
      saveCanvasList(updated);
      return updated;
    });
  }, []);

  const handleDeleteCategoryUI = useCallback((categoryId: string) => {
    setCanvasListState(prev => {
      const updated = deleteCategory(prev, categoryId);
      saveCanvasList(updated);
      return updated;
    });
  }, []);

  const handleToggleCategoryCollapseUI = useCallback((categoryId: string) => {
    setCanvasListState(prev => {
      const updated = toggleCategoryCollapse(prev, categoryId);
      saveCanvasList(updated);
      return updated;
    });
  }, []);

  const handleMoveCanvasToCategoryUI = useCallback((canvasId: string, categoryId: string | null) => {
    setCanvasListState(prev => {
      const updated = moveCanvasToCategory(prev, canvasId, categoryId);
      saveCanvasList(updated);
      return updated;
    });
  }, []);


  // Create handler dependencies for extracted message handlers
  const getHandlerContext = useCallback((): HandlerContext | null => {
    const agentCanvasId = agentActiveCanvasIdRef.current;
    const userCanvasId = activeCanvasIdRef.current;
    const targetCanvasId = agentCanvasId || userCanvasId;
    const isSameCanvas = targetCanvasId === userCanvasId;

    if (isSameCanvas && excalidrawAPIRef.current) {
      return {
        api: excalidrawAPIRef.current,
        canvasId: targetCanvasId,
        useDirectStorage: false,
      };
    }

    // Different canvas: signal to use direct storage manipulation
    return {
      api: null as unknown as ExcalidrawAPI,
      canvasId: targetCanvasId,
      useDirectStorage: true,
    };
  }, []);

  const handlerDeps: HandlerDeps = useMemo(() => ({
    getContext: getHandlerContext,
    storage: {
      loadCanvasScene,
      saveCanvasScene,
      loadFilesForCanvas,
    },
    saveAndSync: saveAndSyncScene,
    CaptureUpdateAction: {
      IMMEDIATELY: 'IMMEDIATELY' as const,
    },
  }), [getHandlerContext, saveAndSyncScene]);

  // Handler functions for drawing commands (use extracted handlers)
  const handleAddShape = useCallback(
    (id: string, params: AddShapeParams) => addShapeHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleAddText = useCallback(
    (id: string, params: AddTextParams) => addTextHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleAddLine = useCallback(
    (id: string, params: AddLineParams) => addLineHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleAddArrow = useCallback(
    (id: string, params: AddArrowParams) => addArrowHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleAddPolygon = useCallback(
    (id: string, params: AddPolygonParams) => addPolygonHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleAddImage = useCallback(
    (id: string, params: AddImageParams) => addImageHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleDeleteElements = useCallback(
    (id: string, params: DeleteElementsParams) => deleteElementsHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleRotateElements = useCallback(
    (id: string, params: RotateElementsParams) => rotateElementsHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleGroupElements = useCallback(
    (id: string, params: GroupElementsParams) => groupElementsHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleUngroupElement = useCallback(
    (id: string, params: UngroupElementParams) => ungroupElementHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleMoveElements = useCallback(
    (id: string, params: MoveElementsParams) => moveElementsHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleResizeElements = useCallback(
    (id: string, params: ResizeElementsParams) => resizeElementsHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleReadScene = useCallback(
    (id: string) => readSceneHandler(handlerDeps, id),
    [handlerDeps]
  );

  const handleLoadScene = useCallback(
    (id: string, params: LoadSceneParams) => loadSceneHandler(handlerDeps, id, params),
    [handlerDeps]
  );

  const handleSaveScene = useCallback(
    (id: string) => saveSceneHandler(handlerDeps, id),
    [handlerDeps]
  );

  const handleClearCanvas = useCallback(
    (id: string) => clearCanvasHandler(handlerDeps, id),
    [handlerDeps]
  );

  const handleExportImage = useCallback(
    (id: string, params?: ExportImageParams) => exportImageHandler(handlerDeps, id, params, exportToBlob),
    [handlerDeps]
  );

  // Process incoming commands
  const processCommand = useCallback(async (command: { type: string; id: string; params?: unknown }) => {
    let result;
    switch (command.type) {
      case 'listCanvases':
        result = handleListCanvases(command.id); break;
      case 'createCanvas':
        result = await handleCreateCanvas(command.id, command.params as CreateCanvasParams); break;
      case 'switchCanvas':
        result = await handleSwitchCanvas(command.id, command.params as SwitchCanvasParams); break;
      case 'renameCanvas':
        result = handleRenameCanvas(command.id, command.params as RenameCanvasParams); break;
      case 'addShape':
        result = await handleAddShape(command.id, command.params as AddShapeParams); break;
      case 'addText':
        result = await handleAddText(command.id, command.params as AddTextParams); break;
      case 'addLine':
        result = await handleAddLine(command.id, command.params as AddLineParams); break;
      case 'addArrow':
        result = await handleAddArrow(command.id, command.params as AddArrowParams); break;
      case 'addPolygon':
        result = await handleAddPolygon(command.id, command.params as AddPolygonParams); break;
      case 'addImage':
        result = await handleAddImage(command.id, command.params as AddImageParams); break;
      case 'deleteElements':
        result = await handleDeleteElements(command.id, command.params as DeleteElementsParams); break;
      case 'rotateElements':
        result = await handleRotateElements(command.id, command.params as RotateElementsParams); break;
      case 'groupElements':
        result = await handleGroupElements(command.id, command.params as GroupElementsParams); break;
      case 'ungroupElement':
        result = await handleUngroupElement(command.id, command.params as UngroupElementParams); break;
      case 'moveElements':
        result = await handleMoveElements(command.id, command.params as MoveElementsParams); break;
      case 'resizeElements':
        result = await handleResizeElements(command.id, command.params as ResizeElementsParams); break;
      case 'readScene':
        result = await handleReadScene(command.id); break;
      case 'loadScene':
        result = await handleLoadScene(command.id, command.params as LoadSceneParams); break;
      case 'saveScene':
        result = await handleSaveScene(command.id); break;
      case 'exportImage':
        result = await handleExportImage(command.id, command.params as ExportImageParams); break;
      case 'clearCanvas':
        result = await handleClearCanvas(command.id); break;
      case 'createFolder':
        result = handleCreateFolder(command.id, command.params as CreateFolderParams); break;
      case 'deleteFolder':
        result = handleDeleteFolder(command.id, command.params as DeleteFolderParams); break;
      case 'moveCanvasToFolder':
        result = handleMoveCanvasToFolder(command.id, command.params as MoveCanvasToFolderParams); break;
      default:
        result = { type: 'error', id: command.id, success: false, error: `Unknown command: ${command.type}` }; break;
    }

    // Post-processing: scroll to newly added element if animated flag is set
    const params = command.params as { animated?: boolean } | undefined;
    const resultObj = result as { success?: boolean; elementId?: string } | undefined;
    if (params?.animated && resultObj?.success && resultObj?.elementId) {
      const api = excalidrawAPIRef.current;
      if (api) {
        const element = api.getSceneElements().find(el => el.id === resultObj.elementId);
        if (element) {
          const appState = api.getAppState() as {
            scrollX: number; scrollY: number;
            zoom: { value: number };
            width: number; height: number;
          };
          const zoom = appState.zoom.value;

          const elScreenW = (element.width || 0) * zoom;
          const elScreenH = (element.height || 0) * zoom;
          const minScreenSize = 60;
          const isTooSmall = elScreenW < minScreenSize && elScreenH < minScreenSize;
          const isTooLarge = elScreenW > appState.width * 0.9 || elScreenH > appState.height * 0.9;

          if (isTooSmall || isTooLarge) {
            // Zoom to fit: zoom in for small, zoom out for large
            api.scrollToContent(element, {
              fitToViewport: true,
              viewportZoomFactor: 0.7,
              animate: true,
              duration: 300,
              maxZoom: 1,
            });
          } else {
            const padding = 80 / zoom;

            const vpLeft = -appState.scrollX;
            const vpTop = -appState.scrollY;
            const vpRight = vpLeft + appState.width / zoom;
            const vpBottom = vpTop + appState.height / zoom;

            const elLeft = element.x;
            const elTop = element.y;
            const elRight = elLeft + (element.width || 0);
            const elBottom = elTop + (element.height || 0);

            const isVisible =
              elLeft >= vpLeft + padding &&
              elRight <= vpRight - padding &&
              elTop >= vpTop + padding &&
              elBottom <= vpBottom - padding;

            if (!isVisible) {
              let newScrollX = appState.scrollX;
              let newScrollY = appState.scrollY;

              if (elLeft < vpLeft + padding) {
                newScrollX = -(elLeft - padding);
              } else if (elRight > vpRight - padding) {
                newScrollX = -(elRight + padding) + appState.width / zoom;
              }

              if (elTop < vpTop + padding) {
                newScrollY = -(elTop - padding);
              } else if (elBottom > vpBottom - padding) {
                newScrollY = -(elBottom + padding) + appState.height / zoom;
              }

              api.updateScene({ appState: { scrollX: newScrollX, scrollY: newScrollY } });
            }
          }
        }
      }
    }

    return result;
  }, [
    handleListCanvases, handleCreateCanvas, handleSwitchCanvas, handleRenameCanvas,
    handleCreateFolder, handleDeleteFolder, handleMoveCanvasToFolder,
    handleAddShape, handleAddText, handleAddLine, handleAddArrow, handleAddPolygon, handleAddImage,
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

    saveTimeoutRef.current = setTimeout(async () => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      // Read current state from API (not from closure) to avoid stale data
      const activeId = activeCanvasIdRef.current;
      // Use getSceneElementsIncludingDeleted to include deleted elements for proper sync
      const allElements = api.getSceneElementsIncludingDeleted();
      const appState = api.getAppState();
      const allFiles = api.getFiles() as Record<string, BinaryFileData>;
      const filteredAppState = filterAppState(appState);

      // Only save files that are actually used by elements in this canvas
      // This prevents files from being incorrectly associated with multiple canvases
      const files = collectUsedFiles(
        allElements as Array<{ type?: string; fileId?: string; isDeleted?: boolean }>,
        allFiles
      );

      const sceneData: CanvasSceneData = {
        elements: allElements as unknown[],
        appState: filteredAppState,
        files,
      };

      await saveCanvasScene(activeId, sceneData);

      // Update scene cache for thumbnail (use non-deleted elements for display)
      const visibleElements = allElements.filter((e: { isDeleted?: boolean }) => !e.isDeleted);
      setSceneCache(prev => {
        const next = new Map(prev);
        next.set(activeId, { ...sceneData, elements: visibleElements as unknown[] });
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

  // Don't render Excalidraw until scenes are loaded from IndexedDB
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#f5f5f5',
      }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <CanvasSidebar
        canvases={canvasListState.canvases}
        activeCanvasId={canvasListState.activeCanvasId}
        agentActiveCanvasId={agentActiveCanvasId}
        scenes={sceneCache}
        categories={canvasListState.categories}
        canvasCategoryMap={canvasListState.canvasCategoryMap}
        isDarkMode={isDarkMode}
        canvasBackgroundColor={canvasBackgroundColor}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectCanvas={handleSelectCanvas}
        onCreateCanvas={handleCreateCanvasUI}
        onRenameCanvas={handleRenameCanvasUI}
        onDeleteCanvas={handleDeleteCanvasUI}
        onCreateCategory={handleCreateCategoryUI}
        onRenameCategory={handleRenameCategoryUI}
        onDeleteCategory={handleDeleteCategoryUI}
        onToggleCategoryCollapse={handleToggleCategoryCollapseUI}
        onMoveCanvasToCategory={handleMoveCanvasToCategoryUI}
      />
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawAPIRef.current = api as unknown as ExcalidrawAPI; }}
          initialData={currentScene ? { elements: currentScene.elements as never[], appState: currentScene.appState, files: currentScene.files as never } : undefined}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
