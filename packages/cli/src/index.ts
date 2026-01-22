import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { encode as toToon } from '@toon-format/toon';
import { start } from './commands/start.js';
import { connectToCanvas, generateId } from './lib/ws-client.js';
import type {
  AddShapeParams, AddShapeResponse,
  AddTextResponse,
  AddLineResponse,
  AddArrowResponse,
  AddPolygonResponse,
  DeleteElementsResponse,
  RotateElementsResponse,
  GroupElementsResponse,
  UngroupElementResponse,
  MoveElementsResponse,
  ReadSceneResponse,
  SaveSceneResponse,
  ExportImageResponse,
  ClearCanvasResponse,
} from './lib/protocol.js';

const program = new Command();

program
  .name('agent-canvas')
  .description('CLI for Agent Canvas - Excalidraw interface for AI agents')
  .version('0.4.0');

program
  .command('start')
  .description('Start the canvas server and open in browser')
  .option('-f, --file <path>', 'Load an .excalidraw file on start')
  .action(async (options) => {
    await start(options.file);
  });

// ============================================================================
// Add Shape
// ============================================================================
program
  .command('add-shape')
  .description('Add a shape to the canvas')
  .requiredOption('-t, --type <type>', 'Shape type: rectangle, ellipse, or diamond')
  .requiredOption('-x, --x <number>', 'X coordinate', parseFloat)
  .requiredOption('-y, --y <number>', 'Y coordinate', parseFloat)
  .option('-w, --width <number>', 'Width of the shape', parseFloat)
  .option('-h, --height <number>', 'Height of the shape', parseFloat)
  .option('--stroke-color <color>', 'Stroke color (hex)')
  .option('--background-color <color>', 'Background color (hex or "transparent")')
  .option('--stroke-width <number>', 'Stroke width in pixels', parseFloat)
  .option('--stroke-style <style>', 'Stroke style: solid, dashed, or dotted')
  .option('--fill-style <style>', 'Fill style: hachure, cross-hatch, solid, or zigzag')
  .option('-l, --label <text>', 'Text label inside the shape')
  .option('--label-font-size <number>', 'Label font size', parseFloat)
  .option('-n, --note <text>', 'Note for this element (stored in customData)')
  .action(async (options) => {
    const client = await connectToCanvas();
    const params: AddShapeParams = {
      type: options.type,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      strokeColor: options.strokeColor,
      backgroundColor: options.backgroundColor,
      strokeWidth: options.strokeWidth,
      strokeStyle: options.strokeStyle,
      fillStyle: options.fillStyle,
      customData: options.note ? { note: options.note } : undefined,
    };
    if (options.label) {
      params.label = { text: options.label, fontSize: options.labelFontSize };
    }
    const result = await client.send<AddShapeResponse>({ type: 'addShape', id: generateId(), params });
    if (result.success) {
      const dims = result.width !== undefined && result.height !== undefined
        ? ` x=${result.x} y=${result.y} w=${result.width} h=${result.height}`
        : '';
      console.log(`Shape created (id: ${result.elementId}${dims})`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Add Text
// ============================================================================
program
  .command('add-text')
  .description('Add text to the canvas')
  .requiredOption('-t, --text <text>', 'Text content (use \\n for newlines)')
  .requiredOption('-x, --x <number>', 'X coordinate', parseFloat)
  .requiredOption('-y, --y <number>', 'Y coordinate', parseFloat)
  .option('--font-size <number>', 'Font size', parseFloat)
  .option('--text-align <align>', 'Text alignment: left, center, or right')
  .option('--stroke-color <color>', 'Text color (hex)')
  .option('-n, --note <text>', 'Note for this element (stored in customData)')
  .action(async (options) => {
    const client = await connectToCanvas();
    const result = await client.send<AddTextResponse>({
      type: 'addText',
      id: generateId(),
      params: {
        text: options.text,
        x: options.x,
        y: options.y,
        fontSize: options.fontSize,
        textAlign: options.textAlign,
        strokeColor: options.strokeColor,
        customData: options.note ? { note: options.note } : undefined,
      },
    });
    if (result.success) {
      console.log(`Text created (id: ${result.elementId})`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Add Line
// ============================================================================
program
  .command('add-line')
  .description('Add a line to the canvas')
  .requiredOption('-x, --x <number>', 'Start X coordinate', parseFloat)
  .requiredOption('-y, --y <number>', 'Start Y coordinate', parseFloat)
  .requiredOption('--end-x <number>', 'End X coordinate', parseFloat)
  .requiredOption('--end-y <number>', 'End Y coordinate', parseFloat)
  .option('--stroke-color <color>', 'Line color (hex)')
  .option('--stroke-width <number>', 'Line width in pixels', parseFloat)
  .option('--stroke-style <style>', 'Line style: solid, dashed, or dotted')
  .option('-n, --note <text>', 'Note for this element (stored in customData)')
  .action(async (options) => {
    const client = await connectToCanvas();
    const result = await client.send<AddLineResponse>({
      type: 'addLine',
      id: generateId(),
      params: {
        x: options.x,
        y: options.y,
        endX: options.endX,
        endY: options.endY,
        strokeColor: options.strokeColor,
        strokeWidth: options.strokeWidth,
        strokeStyle: options.strokeStyle,
        customData: options.note ? { note: options.note } : undefined,
      },
    });
    if (result.success) {
      console.log(`Line created (id: ${result.elementId})`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Add Arrow
// ============================================================================
program
  .command('add-arrow')
  .description('Add an arrow to the canvas')
  .requiredOption('-x, --x <number>', 'Start X coordinate', parseFloat)
  .requiredOption('-y, --y <number>', 'Start Y coordinate', parseFloat)
  .requiredOption('--end-x <number>', 'End X coordinate', parseFloat)
  .requiredOption('--end-y <number>', 'End Y coordinate', parseFloat)
  .option('--stroke-color <color>', 'Arrow color (hex)')
  .option('--stroke-width <number>', 'Arrow width in pixels', parseFloat)
  .option('--stroke-style <style>', 'Arrow style: solid, dashed, or dotted')
  .option('--start-arrowhead <type>', 'Start arrowhead: arrow, bar, dot, triangle, diamond, none')
  .option('--end-arrowhead <type>', 'End arrowhead: arrow, bar, dot, triangle, diamond, none')
  .option('--arrow-type <type>', 'Arrow type: sharp (straight), round (curved), elbow (90° angles)')
  .option('--via <points>', 'Intermediate points as "x1,y1;x2,y2;..." (absolute coordinates). For round: 1 control point. For elbow: multiple turn points.')
  .option('-n, --note <text>', 'Note for this element (stored in customData)')
  .action(async (options) => {
    // Parse --via option into midpoints array
    let midpoints: Array<{ x: number; y: number }> | undefined;
    if (options.via) {
      midpoints = options.via.split(';').map((pt: string) => {
        const [x, y] = pt.split(',').map(Number);
        return { x, y };
      });
    }

    const client = await connectToCanvas();
    const result = await client.send<AddArrowResponse>({
      type: 'addArrow',
      id: generateId(),
      params: {
        x: options.x,
        y: options.y,
        endX: options.endX,
        endY: options.endY,
        strokeColor: options.strokeColor,
        strokeWidth: options.strokeWidth,
        strokeStyle: options.strokeStyle,
        startArrowhead: options.startArrowhead,
        endArrowhead: options.endArrowhead,
        arrowType: options.arrowType,
        midpoints,
        customData: options.note ? { note: options.note } : undefined,
      },
    });
    if (result.success) {
      console.log(`Arrow created (id: ${result.elementId})`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Add Polygon
// ============================================================================
program
  .command('add-polygon')
  .description('Add a polygon to the canvas')
  .requiredOption('-p, --points <json>', 'Points as JSON array: [{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]')
  .option('--stroke-color <color>', 'Stroke color (hex)')
  .option('--background-color <color>', 'Background color (hex or "transparent")')
  .option('--stroke-width <number>', 'Stroke width in pixels', parseFloat)
  .option('--stroke-style <style>', 'Stroke style: solid, dashed, or dotted')
  .option('--fill-style <style>', 'Fill style: hachure, cross-hatch, solid, or zigzag')
  .option('-n, --note <text>', 'Note for this element (stored in customData)')
  .action(async (options) => {
    let points;
    try {
      points = JSON.parse(options.points);
    } catch {
      console.error('Invalid points JSON');
      process.exit(1);
    }
    const client = await connectToCanvas();
    const result = await client.send<AddPolygonResponse>({
      type: 'addPolygon',
      id: generateId(),
      params: {
        points,
        strokeColor: options.strokeColor,
        backgroundColor: options.backgroundColor,
        strokeWidth: options.strokeWidth,
        strokeStyle: options.strokeStyle,
        fillStyle: options.fillStyle,
        customData: options.note ? { note: options.note } : undefined,
      },
    });
    if (result.success) {
      console.log(`Polygon created (id: ${result.elementId})`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Delete Elements
// ============================================================================
program
  .command('delete-elements')
  .description('Delete elements from the canvas')
  .requiredOption('-i, --element-ids <ids>', 'Comma-separated element IDs to delete')
  .action(async (options) => {
    const elementIds = options.elementIds.split(',').map((s: string) => s.trim());
    const client = await connectToCanvas();
    const result = await client.send<DeleteElementsResponse>({
      type: 'deleteElements',
      id: generateId(),
      params: { elementIds },
    });
    if (result.success) {
      console.log(`Deleted ${result.deletedCount} element(s)`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Rotate Elements
// ============================================================================
program
  .command('rotate-elements')
  .description('Rotate elements (degrees, positive = clockwise)')
  .requiredOption('-i, --element-ids <ids>', 'Comma-separated element IDs to rotate')
  .requiredOption('-a, --angle <degrees>', 'Rotation angle in degrees', parseFloat)
  .action(async (options) => {
    const elementIds = options.elementIds.split(',').map((s: string) => s.trim());
    const client = await connectToCanvas();
    const result = await client.send<RotateElementsResponse>({
      type: 'rotateElements',
      id: generateId(),
      params: { elementIds, angle: options.angle },
    });
    if (result.success) {
      console.log(`Rotated ${result.rotatedCount} element(s)`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Group Elements
// ============================================================================
program
  .command('group-elements')
  .description('Group multiple elements together')
  .requiredOption('-i, --element-ids <ids>', 'Comma-separated element IDs')
  .action(async (options) => {
    const elementIds = options.elementIds.split(',').map((s: string) => s.trim());
    const client = await connectToCanvas();
    const result = await client.send<GroupElementsResponse>({
      type: 'groupElements',
      id: generateId(),
      params: { elementIds },
    });
    if (result.success) {
      console.log(`Group created (id: ${result.groupId})`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Ungroup Element
// ============================================================================
program
  .command('ungroup-element')
  .description('Remove an element from its group')
  .requiredOption('-i, --element-id <id>', 'Element ID to ungroup')
  .action(async (options) => {
    const client = await connectToCanvas();
    const result = await client.send<UngroupElementResponse>({
      type: 'ungroupElement',
      id: generateId(),
      params: { elementId: options.elementId },
    });
    if (result.success) {
      console.log('Element ungrouped');
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Move Elements
// ============================================================================
program
  .command('move-elements')
  .description('Move elements by offset')
  .requiredOption('-i, --element-ids <ids>', 'Comma-separated element IDs')
  .requiredOption('--delta-x <number>', 'Horizontal offset (positive = right)', parseFloat)
  .requiredOption('--delta-y <number>', 'Vertical offset (positive = down)', parseFloat)
  .action(async (options) => {
    const elementIds = options.elementIds.split(',').map((s: string) => s.trim());
    const client = await connectToCanvas();
    const result = await client.send<MoveElementsResponse>({
      type: 'moveElements',
      id: generateId(),
      params: { elementIds, deltaX: options.deltaX, deltaY: options.deltaY },
    });
    if (result.success) {
      console.log(`Moved ${result.movedCount} element(s)`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Read Scene
// ============================================================================
program
  .command('read')
  .description('Read all elements from the canvas (TOON format by default)')
  .option('--json', 'Output raw Excalidraw scene JSON')
  .option('--with-style', 'Include style info (stroke, bg) in TOON output')
  .action(async (options) => {
    const client = await connectToCanvas();

    if (options.json) {
      // Return raw Excalidraw scene data
      const result = await client.send<SaveSceneResponse>({
        type: 'saveScene',
        id: generateId(),
      });
      if (result.success && result.data) {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error(`Failed: ${result.error}`);
        process.exit(1);
      }
      client.close();
      return;
    }

    const result = await client.send<ReadSceneResponse>({
      type: 'readScene',
      id: generateId(),
    });
    if (result.success && result.elements) {
        const withStyle = options.withStyle;

        // Separate elements into shapes, lines, labels (bound text), texts (standalone text), and groups
        const shapes: Array<Record<string, unknown>> = [];
        const lines: Array<Record<string, unknown>> = [];
        const labels: Array<Record<string, unknown>> = [];
        const texts: Array<Record<string, unknown>> = [];
        const groupsMap = new Map<string, string[]>(); // groupId -> elementIds

        for (const el of result.elements) {
          const angle = el.angle ? Math.round(el.angle * 180 / Math.PI) : 0; // Convert radians to degrees

          // Collect group memberships
          if (el.groupIds?.length) {
            for (const groupId of el.groupIds) {
              if (!groupsMap.has(groupId)) {
                groupsMap.set(groupId, []);
              }
              groupsMap.get(groupId)!.push(el.id);
            }
          }

          if (el.type === 'text') {
            if (el.containerId) {
              // Bound text (label)
              labels.push({
                id: el.id,
                containerId: el.containerId,
                content: el.text ?? '',
                x: Math.round(el.x),
                y: Math.round(el.y),
                w: el.width !== undefined ? Math.round(el.width) : null,
                h: el.height !== undefined ? Math.round(el.height) : null,
              });
            } else {
              // Standalone text
              const text: Record<string, unknown> = {
                id: el.id,
                content: el.text ?? '',
                x: Math.round(el.x),
                y: Math.round(el.y),
                w: el.width !== undefined ? Math.round(el.width) : null,
                h: el.height !== undefined ? Math.round(el.height) : null,
                angle,
                note: (el.customData as { note?: string } | undefined)?.note ?? null,
              };
              if (withStyle) {
                text.stroke = el.strokeColor ?? null;
              }
              texts.push(text);
            }
          } else if (el.type === 'line' || el.type === 'arrow') {
            const pts = el.points ?? [];
            // Check if it's a closed polygon (first and last point within 8px threshold)
            const isPolygon = el.type === 'line' && pts.length >= 3 && (() => {
              const first = pts[0];
              const last = pts[pts.length - 1];
              const distance = Math.sqrt((last[0] - first[0]) ** 2 + (last[1] - first[1]) ** 2);
              return distance <= 8;
            })();

            if (isPolygon) {
              // Polygon - treat as shape
              // Calculate bounding box from points
              const xs = pts.map(p => p[0]);
              const ys = pts.map(p => p[1]);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const shape: Record<string, unknown> = {
                id: el.id,
                type: 'polygon',
                x: Math.round(el.x + minX),
                y: Math.round(el.y + minY),
                w: Math.round(maxX - minX),
                h: Math.round(maxY - minY),
                angle,
                labelId: null,
                note: (el.customData as { note?: string } | undefined)?.note ?? null,
              };
              if (withStyle) {
                shape.stroke = el.strokeColor ?? null;
                shape.bg = el.backgroundColor ?? null;
              }
              shapes.push(shape);
            } else {
              // Line/Arrow element
              const lastPt = pts.length > 0 ? pts[pts.length - 1] : [0, 0];
              const line: Record<string, unknown> = {
                id: el.id,
                type: el.type,
                x: Math.round(el.x),
                y: Math.round(el.y),
                endX: Math.round(el.x + lastPt[0]),
                endY: Math.round(el.y + lastPt[1]),
                // Show intermediate points (via) in the same format as --via input
                via: pts.length > 2
                  ? pts.slice(1, -1).map(pt => `${Math.round(el.x + pt[0])},${Math.round(el.y + pt[1])}`).join(';')
                  : null,
                angle,
                note: (el.customData as { note?: string } | undefined)?.note ?? null,
              };
              if (withStyle) {
                line.stroke = el.strokeColor ?? null;
              }
              lines.push(line);
            }
          } else {
            // Shape element (rectangle, ellipse, diamond, etc.)
            const boundText = el.boundElements?.find(b => b.type === 'text');
            const shape: Record<string, unknown> = {
              id: el.id,
              type: el.type,
              x: Math.round(el.x),
              y: Math.round(el.y),
              w: el.width !== undefined ? Math.round(el.width) : null,
              h: el.height !== undefined ? Math.round(el.height) : null,
              angle,
              labelId: boundText?.id ?? null,
              note: (el.customData as { note?: string } | undefined)?.note ?? null,
            };
            if (withStyle) {
              shape.stroke = el.strokeColor ?? null;
              shape.bg = el.backgroundColor ?? null;
            }
            shapes.push(shape);
          }
        }

        // Build groups array
        const groups = Array.from(groupsMap.entries()).map(([id, elementIds]) => ({
          id,
          elementIds: elementIds.join(','),
        }));

        console.log(toToon({ shapes, lines, labels, texts, groups }));
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Export Image
// ============================================================================
program
  .command('export')
  .description('Export canvas to PNG image')
  .option('-o, --output <path>', 'Output file path')
  .option('--no-background', 'Export without background')
  .option('--dark', 'Use dark mode')
  .option('--embed-scene', 'Embed scene data in PNG')
  .option('--scale <scale>', 'Export scale (1, 2, or 3)', '1')
  .action(async (options) => {
    const scale = parseInt(options.scale, 10);
    if (![1, 2, 3].includes(scale)) {
      console.error('Scale must be 1, 2, or 3');
      process.exit(1);
    }

    const client = await connectToCanvas();
    const result = await client.send<ExportImageResponse>({
      type: 'exportImage',
      id: generateId(),
      params: {
        background: options.background,
        dark: options.dark ?? false,
        embedScene: options.embedScene ?? false,
        scale: scale as 1 | 2 | 3,
      },
    });

    if (result.success && result.dataUrl) {
      // Extract base64 data from data URL
      const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate output path if not specified
      const outputPath = options.output || `canvas-${Date.now()}.png`;
      writeFileSync(outputPath, buffer);
      console.log(`Exported to ${outputPath}`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Save Scene
// ============================================================================
program
  .command('save')
  .description('Save canvas to an .excalidraw file')
  .argument('<filepath>', 'Output file path (.excalidraw)')
  .action(async (filepath: string) => {
    const client = await connectToCanvas();
    const result = await client.send<SaveSceneResponse>({
      type: 'saveScene',
      id: generateId(),
    });

    if (result.success && result.data) {
      const outputPath = filepath.endsWith('.excalidraw') ? filepath : `${filepath}.excalidraw`;
      writeFileSync(outputPath, JSON.stringify(result.data, null, 2));
      console.log(`Saved to ${outputPath}`);
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

// ============================================================================
// Clear Canvas
// ============================================================================
program
  .command('clear')
  .description('Clear all elements from the canvas')
  .action(async () => {
    const client = await connectToCanvas();
    const result = await client.send<ClearCanvasResponse>({
      type: 'clearCanvas',
      id: generateId(),
    });
    if (result.success) {
      console.log('Canvas cleared');
    } else {
      console.error(`Failed: ${result.error}`);
      process.exit(1);
    }
    client.close();
  });

program.parse();
