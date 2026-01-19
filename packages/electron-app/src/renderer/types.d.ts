import type { CanvasAPI } from '../main/preload';

declare global {
  interface Window {
    canvasAPI: CanvasAPI;
  }
}

export {};
