import { describe, it, expect } from 'vitest';
import {
  convertElementsToToon,
  processTextElement,
  processLineElement,
  processShapeElement,
  processImageElement,
  buildGroupsFromElements,
} from '../toon-converter';
import type { SceneElement } from '../protocol';

// Helper to create a minimal SceneElement
function createElement(overrides: Partial<SceneElement> & { id: string; type: string }): SceneElement {
  return {
    x: 0,
    y: 0,
    ...overrides,
  };
}

describe('toon-converter', () => {
  // ============================================================================
  // convertElementsToToon
  // ============================================================================
  describe('convertElementsToToon', () => {
    it('should return empty result for empty array', () => {
      const result = convertElementsToToon([], false);

      expect(result).toEqual({
        shapes: [],
        lines: [],
        labels: [],
        texts: [],
        images: [],
        groups: [],
      });
    });

    it('should process rectangle element into shapes array', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'rect-1',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 150,
          height: 80,
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes).toHaveLength(1);
      expect(result.shapes[0]).toEqual({
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        w: 150,
        h: 80,
        angle: 0,
        labelId: null,
        note: null,
      });
    });

    it('should process ellipse element into shapes array', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'ellipse-1',
          type: 'ellipse',
          x: 50,
          y: 75,
          width: 100,
          height: 60,
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes).toHaveLength(1);
      expect(result.shapes[0].type).toBe('ellipse');
    });

    it('should process diamond element into shapes array', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'diamond-1',
          type: 'diamond',
          x: 0,
          y: 0,
          width: 80,
          height: 80,
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes).toHaveLength(1);
      expect(result.shapes[0].type).toBe('diamond');
    });

    it('should process standalone text into texts array', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'text-1',
          type: 'text',
          x: 10,
          y: 20,
          text: 'Hello World',
          width: 100,
          height: 20,
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.texts).toHaveLength(1);
      expect(result.texts[0]).toEqual({
        id: 'text-1',
        content: 'Hello World',
        x: 10,
        y: 20,
        w: 100,
        h: 20,
        angle: 0,
        note: null,
      });
    });

    it('should process bound text (with containerId) into labels array', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'label-1',
          type: 'text',
          x: 50,
          y: 60,
          text: 'Label Text',
          width: 80,
          height: 16,
          containerId: 'rect-1',
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0]).toEqual({
        id: 'label-1',
        containerId: 'rect-1',
        content: 'Label Text',
        x: 50,
        y: 60,
        w: 80,
        h: 16,
      });
    });

    it('should process line element into lines array', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'line-1',
          type: 'line',
          x: 0,
          y: 0,
          points: [[0, 0], [100, 50]],
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toEqual({
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0,
        endX: 100,
        endY: 50,
        via: null,
        angle: 0,
        note: null,
      });
    });

    it('should process arrow element into lines array with type arrow', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'arrow-1',
          type: 'arrow',
          x: 10,
          y: 20,
          points: [[0, 0], [80, 40]],
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].type).toBe('arrow');
      expect(result.lines[0].endX).toBe(90);
      expect(result.lines[0].endY).toBe(60);
    });

    it('should process closed line (polygon) into shapes array', () => {
      // A closed polygon: points form a triangle that closes back to origin (within 8px)
      const elements: SceneElement[] = [
        createElement({
          id: 'polygon-1',
          type: 'line',
          x: 100,
          y: 100,
          points: [[0, 0], [50, 0], [25, 40], [0, 0]], // closed triangle
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes).toHaveLength(1);
      expect(result.shapes[0].type).toBe('polygon');
      expect(result.shapes[0].x).toBe(100);
      expect(result.shapes[0].y).toBe(100);
      expect(result.shapes[0].w).toBe(50);
      expect(result.shapes[0].h).toBe(40);
    });

    it('should process image element into images array', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'img-1',
          type: 'image',
          x: 200,
          y: 300,
          width: 400,
          height: 300,
          fileId: 'file-abc123',
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.images).toHaveLength(1);
      expect(result.images[0]).toEqual({
        id: 'img-1',
        x: 200,
        y: 300,
        w: 400,
        h: 300,
        angle: 0,
        fileId: 'file-abc123',
        note: null,
      });
    });

    it('should collect groups from elements with groupIds', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'el-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          groupIds: ['group-A'],
        }),
        createElement({
          id: 'el-2',
          type: 'rectangle',
          x: 100,
          y: 0,
          groupIds: ['group-A'],
        }),
        createElement({
          id: 'el-3',
          type: 'rectangle',
          x: 200,
          y: 0,
          groupIds: ['group-B'],
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.groups).toHaveLength(2);
      expect(result.groups).toContainEqual({ id: 'group-A', elementIds: 'el-1,el-2' });
      expect(result.groups).toContainEqual({ id: 'group-B', elementIds: 'el-3' });
    });

    it('should include stroke/bg when withStyle=true', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'rect-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          strokeColor: '#ff0000',
          backgroundColor: '#00ff00',
        }),
      ];

      const result = convertElementsToToon(elements, true);

      expect(result.shapes[0].stroke).toBe('#ff0000');
      expect(result.shapes[0].bg).toBe('#00ff00');
    });

    it('should not include stroke/bg when withStyle=false', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'rect-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          strokeColor: '#ff0000',
          backgroundColor: '#00ff00',
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes[0]).not.toHaveProperty('stroke');
      expect(result.shapes[0]).not.toHaveProperty('bg');
    });

    it('should convert angle from radians to degrees', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'rect-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          angle: Math.PI / 2, // 90 degrees
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes[0].angle).toBe(90);
    });

    it('should round coordinates to integers', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'rect-1',
          type: 'rectangle',
          x: 100.7,
          y: 200.3,
          width: 150.9,
          height: 80.1,
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes[0].x).toBe(101);
      expect(result.shapes[0].y).toBe(200);
      expect(result.shapes[0].w).toBe(151);
      expect(result.shapes[0].h).toBe(80);
    });

    it('should extract note from customData', () => {
      const elements: SceneElement[] = [
        createElement({
          id: 'rect-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          customData: { note: 'This is a note' },
        }),
      ];

      const result = convertElementsToToon(elements, false);

      expect(result.shapes[0].note).toBe('This is a note');
    });
  });

  // ============================================================================
  // processTextElement
  // ============================================================================
  describe('processTextElement', () => {
    it('should return label type when containerId is set', () => {
      const el = createElement({
        id: 'text-1',
        type: 'text',
        x: 10,
        y: 20,
        text: 'Label',
        containerId: 'rect-1',
      });

      const result = processTextElement(el, false);

      expect(result.type).toBe('label');
      expect(result.data).toEqual({
        id: 'text-1',
        containerId: 'rect-1',
        content: 'Label',
        x: 10,
        y: 20,
        w: null,
        h: null,
      });
    });

    it('should return text type when containerId is not set', () => {
      const el = createElement({
        id: 'text-1',
        type: 'text',
        x: 10,
        y: 20,
        text: 'Standalone',
      });

      const result = processTextElement(el, false);

      expect(result.type).toBe('text');
      expect((result.data as { content: string }).content).toBe('Standalone');
    });

    it('should include stroke when withStyle=true for text', () => {
      const el = createElement({
        id: 'text-1',
        type: 'text',
        x: 0,
        y: 0,
        text: 'Test',
        strokeColor: '#0000ff',
      });

      const result = processTextElement(el, true);

      expect(result.type).toBe('text');
      expect((result.data as { stroke?: string }).stroke).toBe('#0000ff');
    });
  });

  // ============================================================================
  // processLineElement
  // ============================================================================
  describe('processLineElement', () => {
    it('should return shape type for closed polygon', () => {
      const el = createElement({
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0,
        points: [[0, 0], [100, 0], [50, 80], [0, 0]],
      });

      const result = processLineElement(el, false);

      expect(result.type).toBe('shape');
      expect(result.data.type).toBe('polygon');
    });

    it('should return line type for open line', () => {
      const el = createElement({
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0,
        points: [[0, 0], [100, 50]],
      });

      const result = processLineElement(el, false);

      expect(result.type).toBe('line');
    });

    it('should return line type for arrow', () => {
      const el = createElement({
        id: 'arrow-1',
        type: 'arrow',
        x: 0,
        y: 0,
        points: [[0, 0], [100, 50]],
      });

      const result = processLineElement(el, false);

      expect(result.type).toBe('line');
      expect(result.data.type).toBe('arrow');
    });

    it('should calculate via points for multi-point lines', () => {
      const el = createElement({
        id: 'line-1',
        type: 'line',
        x: 10,
        y: 20,
        points: [[0, 0], [50, 25], [100, 50]],
      });

      const result = processLineElement(el, false);

      expect(result.type).toBe('line');
      expect((result.data as { via: string | null }).via).toBe('60,45');
    });

    it('should return null via for two-point lines', () => {
      const el = createElement({
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0,
        points: [[0, 0], [100, 50]],
      });

      const result = processLineElement(el, false);

      expect((result.data as { via: string | null }).via).toBeNull();
    });

    it('should handle line with near-closed points (within 8px) as polygon', () => {
      const el = createElement({
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0,
        points: [[0, 0], [100, 0], [50, 80], [5, 5]], // last point within 8px of first
      });

      const result = processLineElement(el, false);

      expect(result.type).toBe('shape');
    });

    it('should handle line with points not close enough as line', () => {
      const el = createElement({
        id: 'line-1',
        type: 'line',
        x: 0,
        y: 0,
        points: [[0, 0], [100, 0], [50, 80], [10, 10]], // last point > 8px from first
      });

      const result = processLineElement(el, false);

      expect(result.type).toBe('line');
    });
  });

  // ============================================================================
  // processShapeElement
  // ============================================================================
  describe('processShapeElement', () => {
    it('should process basic shape', () => {
      const el = createElement({
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 80,
      });

      const result = processShapeElement(el, false);

      expect(result).toEqual({
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        w: 150,
        h: 80,
        angle: 0,
        labelId: null,
        note: null,
      });
    });

    it('should include labelId when shape has bound text', () => {
      const el = createElement({
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        boundElements: [{ id: 'text-1', type: 'text' }],
      });

      const result = processShapeElement(el, false);

      expect(result.labelId).toBe('text-1');
    });

    it('should not include labelId for bound arrows', () => {
      const el = createElement({
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        boundElements: [{ id: 'arrow-1', type: 'arrow' }],
      });

      const result = processShapeElement(el, false);

      expect(result.labelId).toBeNull();
    });

    it('should include stroke/bg when withStyle=true', () => {
      const el = createElement({
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        strokeColor: '#123456',
        backgroundColor: '#abcdef',
      });

      const result = processShapeElement(el, true);

      expect(result.stroke).toBe('#123456');
      expect(result.bg).toBe('#abcdef');
    });
  });

  // ============================================================================
  // processImageElement
  // ============================================================================
  describe('processImageElement', () => {
    it('should process image element', () => {
      const el = createElement({
        id: 'img-1',
        type: 'image',
        x: 100,
        y: 200,
        width: 400,
        height: 300,
        fileId: 'file-123',
      });

      const result = processImageElement(el);

      expect(result).toEqual({
        id: 'img-1',
        x: 100,
        y: 200,
        w: 400,
        h: 300,
        angle: 0,
        fileId: 'file-123',
        note: null,
      });
    });

    it('should handle missing fileId', () => {
      const el = createElement({
        id: 'img-1',
        type: 'image',
        x: 0,
        y: 0,
      });

      const result = processImageElement(el);

      expect(result.fileId).toBeNull();
    });
  });

  // ============================================================================
  // buildGroupsFromElements
  // ============================================================================
  describe('buildGroupsFromElements', () => {
    it('should return empty array when no groups', () => {
      const elements: SceneElement[] = [
        createElement({ id: 'el-1', type: 'rectangle', x: 0, y: 0 }),
      ];

      const result = buildGroupsFromElements(elements);

      expect(result).toEqual([]);
    });

    it('should collect elements into groups', () => {
      const elements: SceneElement[] = [
        createElement({ id: 'el-1', type: 'rectangle', x: 0, y: 0, groupIds: ['g1'] }),
        createElement({ id: 'el-2', type: 'rectangle', x: 0, y: 0, groupIds: ['g1'] }),
        createElement({ id: 'el-3', type: 'rectangle', x: 0, y: 0, groupIds: ['g2'] }),
      ];

      const result = buildGroupsFromElements(elements);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'g1', elementIds: 'el-1,el-2' });
      expect(result).toContainEqual({ id: 'g2', elementIds: 'el-3' });
    });

    it('should handle elements in multiple groups', () => {
      const elements: SceneElement[] = [
        createElement({ id: 'el-1', type: 'rectangle', x: 0, y: 0, groupIds: ['g1', 'g2'] }),
      ];

      const result = buildGroupsFromElements(elements);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'g1', elementIds: 'el-1' });
      expect(result).toContainEqual({ id: 'g2', elementIds: 'el-1' });
    });
  });
});
