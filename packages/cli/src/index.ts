import { Command } from 'commander';
import { start } from './commands/start.js';
import { load, defaultDeps as loadDeps } from './commands/load.js';
import { addImage, defaultDeps as addImageDeps } from './commands/add-image.js';
import { addShape, defaultDeps as addShapeDeps } from './commands/add-shape.js';
import { addText, defaultDeps as addTextDeps } from './commands/add-text.js';
import { addLine, defaultDeps as addLineDeps } from './commands/add-line.js';
import { addArrow, defaultDeps as addArrowDeps } from './commands/add-arrow.js';
import { addPolygon, defaultDeps as addPolygonDeps } from './commands/add-polygon.js';
import { resizeElements, defaultDeps as resizeElementsDeps } from './commands/resize-elements.js';
import { groupElements, defaultDeps as groupElementsDeps } from './commands/group-elements.js';
import { ungroupElement, defaultDeps as ungroupElementDeps } from './commands/ungroup-element.js';
import { deleteElements, defaultDeps as deleteElementsDeps } from './commands/delete-elements.js';
import { rotateElements, defaultDeps as rotateElementsDeps } from './commands/rotate-elements.js';
import { moveElements, defaultDeps as moveElementsDeps } from './commands/move-elements.js';
import { read, defaultDeps as readDeps } from './commands/read.js';
import { save, defaultDeps as saveDeps } from './commands/save.js';
import { exportImage, defaultDeps as exportDeps } from './commands/export.js';
import { clear, defaultDeps as clearDeps } from './commands/clear.js';
import { list, defaultDeps as listDeps } from './commands/list.js';
import { newCanvas, defaultDeps as newCanvasDeps } from './commands/new-canvas.js';
import { useCanvas, defaultDeps as useCanvasDeps } from './commands/use-canvas.js';
import { renameCanvas, defaultDeps as renameCanvasDeps } from './commands/rename-canvas.js';

const program = new Command();

program
  .name('agent-canvas')
  .description('CLI for Agent Canvas - Excalidraw interface for AI agents')
  .version('0.9.1');

program
  .command('start')
  .description('Start the canvas server and open in browser')
  .action(async () => {
    await start();
  });

program
  .command('load [filepath]')
  .description('Load an .excalidraw file into the current canvas')
  .action(async (filepath: string | undefined) => {
    await load(filepath, loadDeps);
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
    await addShape({
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
      label: options.label,
      labelFontSize: options.labelFontSize,
      note: options.note,
    }, addShapeDeps);
  });

// ============================================================================
// Add Text
// ============================================================================
program
  .command('add-text')
  .description('Add text to the canvas')
  .requiredOption('-t, --text <text>', 'Text content (use \\n for newlines)')
  .requiredOption('--ax <number>', 'Anchor X coordinate', parseFloat)
  .requiredOption('--ay <number>', 'Anchor Y coordinate', parseFloat)
  .option('--font-size <number>', 'Font size', parseFloat)
  .option('--text-align <align>', 'Text alignment: left, center, or right')
  .option('-a, --anchor <anchor>', 'Anchor point: topLeft, topCenter, topRight, leftCenter, center, rightCenter, bottomLeft, bottomCenter, bottomRight')
  .option('--stroke-color <color>', 'Text color (hex)')
  .option('-n, --note <text>', 'Note for this element (stored in customData)')
  .action(async (options) => {
    await addText({
      text: options.text,
      x: options.ax,
      y: options.ay,
      fontSize: options.fontSize,
      textAlign: options.textAlign,
      anchor: options.anchor,
      strokeColor: options.strokeColor,
      note: options.note,
    }, addTextDeps);
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
    await addLine({
      x: options.x,
      y: options.y,
      endX: options.endX,
      endY: options.endY,
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
      strokeStyle: options.strokeStyle,
      note: options.note,
    }, addLineDeps);
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
    await addArrow({
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
      via: options.via,
      note: options.note,
    }, addArrowDeps);
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
    await addPolygon({
      points: options.points,
      strokeColor: options.strokeColor,
      backgroundColor: options.backgroundColor,
      strokeWidth: options.strokeWidth,
      strokeStyle: options.strokeStyle,
      fillStyle: options.fillStyle,
      note: options.note,
    }, addPolygonDeps);
  });

// ============================================================================
// Add Image
// ============================================================================

program
  .command('add-image')
  .description('Add an image to the canvas')
  .requiredOption('-f, --file <path>', 'Path to image file (PNG, JPEG, GIF, SVG, WebP)')
  .requiredOption('-x, --x <number>', 'X coordinate', parseFloat)
  .requiredOption('-y, --y <number>', 'Y coordinate', parseFloat)
  .option('-w, --width <number>', 'Width (default: original image width)', parseFloat)
  .option('-h, --height <number>', 'Height (default: original image height)', parseFloat)
  .option('-n, --note <text>', 'Note for this element (stored in customData)')
  .action(async (options) => {
    await addImage({
      file: options.file,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      note: options.note,
    }, addImageDeps);
  });

// ============================================================================
// Delete Elements
// ============================================================================
program
  .command('delete-elements')
  .description('Delete elements from the canvas')
  .requiredOption('-i, --element-ids <ids>', 'Comma-separated element IDs to delete')
  .action(async (options) => {
    await deleteElements({ elementIds: options.elementIds }, deleteElementsDeps);
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
    await rotateElements({ elementIds: options.elementIds, angle: options.angle }, rotateElementsDeps);
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
    await groupElements({ elementIds }, groupElementsDeps);
  });

// ============================================================================
// Ungroup Element
// ============================================================================
program
  .command('ungroup-element')
  .description('Remove an element from its group')
  .requiredOption('-i, --element-id <id>', 'Element ID to ungroup')
  .action(async (options) => {
    await ungroupElement({ elementId: options.elementId }, ungroupElementDeps);
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
    await moveElements({
      elementIds: options.elementIds,
      deltaX: options.deltaX,
      deltaY: options.deltaY,
    }, moveElementsDeps);
  });

// ============================================================================
// Resize Elements
// ============================================================================
program
  .command('resize-elements')
  .description('Resize elements (shapes and images) by expanding/contracting edges')
  .requiredOption('-i, --element-ids <ids>', 'Comma-separated element IDs')
  .option('--top <number>', 'Expand top edge (positive = upward, negative = contract)', parseFloat)
  .option('--bottom <number>', 'Expand bottom edge (positive = downward, negative = contract)', parseFloat)
  .option('--left <number>', 'Expand left edge (positive = leftward, negative = contract)', parseFloat)
  .option('--right <number>', 'Expand right edge (positive = rightward, negative = contract)', parseFloat)
  .action(async (options) => {
    const elementIds = options.elementIds.split(',').map((s: string) => s.trim());
    await resizeElements({
      elementIds,
      top: options.top,
      bottom: options.bottom,
      left: options.left,
      right: options.right,
    }, resizeElementsDeps);
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
    await read({ json: options.json, withStyle: options.withStyle }, readDeps);
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
    await exportImage({
      output: options.output,
      background: options.background,
      dark: options.dark,
      embedScene: options.embedScene,
      scale: parseInt(options.scale, 10),
    }, exportDeps);
  });

// ============================================================================
// Save Scene
// ============================================================================
program
  .command('save')
  .description('Save canvas to an .excalidraw file')
  .argument('<filepath>', 'Output file path (.excalidraw)')
  .action(async (filepath: string) => {
    await save(filepath, saveDeps);
  });

// ============================================================================
// Clear Canvas
// ============================================================================
program
  .command('clear')
  .description('Clear all elements from the canvas')
  .action(async () => {
    await clear(clearDeps);
  });

// ============================================================================
// List Canvases
// ============================================================================
program
  .command('list')
  .description('List all canvases')
  .action(async () => {
    await list(listDeps);
  });

// ============================================================================
// Create Canvas
// ============================================================================
program
  .command('new')
  .description('Create a new canvas')
  .requiredOption('-n, --name <name>', 'Name for the new canvas')
  .option('--use', 'Switch to the new canvas after creation')
  .action(async (options) => {
    await newCanvas({ name: options.name, use: options.use }, newCanvasDeps);
  });

// ============================================================================
// Switch Canvas
// ============================================================================
program
  .command('use')
  .description('Switch to a canvas by name')
  .argument('<name>', 'Canvas name to switch to')
  .action(async (name: string) => {
    await useCanvas({ name }, useCanvasDeps);
  });

// ============================================================================
// Rename Canvas
// ============================================================================
program
  .command('rename')
  .description('Rename the current canvas')
  .argument('<name>', 'New name for the canvas')
  .action(async (name: string) => {
    await renameCanvas({ newName: name }, renameCanvasDeps);
  });

program.parse();
