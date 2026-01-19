import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { encode as toToon } from '@toon-format/toon';
import { startBrowser, startApp } from './commands/start.js';
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
} from './lib/protocol.js';

const program = new Command();

program
  .name('agent-canvas')
  .description('CLI for Agent Canvas - Excalidraw interface for AI agents')
  .version('0.1.0');

program
  .command('start')
  .description('Start the canvas (browser mode by default, use --app for Electron)')
  .option('-f, --file <path>', 'Load an .excalidraw file on start')
  .option('--app', 'Use Electron app instead of browser')
  .action(async (options) => {
    if (options.app) {
      await startApp(options.file);
    } else {
      await startBrowser(options.file);
    }
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
    };
    if (options.label) {
      params.label = { text: options.label, fontSize: options.labelFontSize };
    }
    const result = await client.send<AddShapeResponse>({ type: 'addShape', id: generateId(), params });
    if (result.success) {
      console.log(`Shape created (id: ${result.elementId})`);
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
  .action(async (options) => {
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
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const client = await connectToCanvas();
    const result = await client.send<ReadSceneResponse>({
      type: 'readScene',
      id: generateId(),
    });
    if (result.success && result.elements) {
      if (options.json) {
        console.log(JSON.stringify(result.elements, null, 2));
      } else {
        // Simplify elements for TOON output
        const elements = result.elements.map(el => ({
          id: el.id,
          type: el.type,
          x: Math.round(el.x),
          y: Math.round(el.y),
          ...(el.width !== undefined && { w: Math.round(el.width) }),
          ...(el.height !== undefined && { h: Math.round(el.height) }),
          ...(el.text && { text: el.text }),
          ...(el.groupIds?.length && { groups: el.groupIds }),
        }));
        console.log(toToon({ elements }));
      }
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

program.parse();
