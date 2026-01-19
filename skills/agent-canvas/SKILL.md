---
name: agent-canvas
description: Draw diagrams, flowcharts, and visualizations on an Excalidraw canvas. Use when the user asks to draw, visualize, create diagrams, or sketch ideas.
license: MIT
metadata:
  author: WHQ25
  version: "0.1.2"
  repository: https://github.com/WHQ25/agent-canvas
allowed-tools: Bash(agent-canvas:*)
---

# Agent Canvas

A CLI tool to interact with an Excalidraw canvas for creating diagrams and visualizations.

## Installation

```bash
npm install -g @agent-canvas/cli
```

## Quick Start

1. Start the canvas (opens in browser):
   ```bash
   agent-canvas start
   ```

2. Use CLI commands to draw on the canvas.

## Commands Reference

### Start Canvas
```bash
agent-canvas start                    # Browser mode (default)
agent-canvas start -f file.excalidraw # Load existing file
agent-canvas start --app              # Electron mode (requires @agent-canvas/electron-app)
```

### Add Shapes
```bash
agent-canvas add-shape -t <type> -x <x> -y <y> [-w <width>] [-h <height>] [options]
```
- Types: `rectangle`, `ellipse`, `diamond`
- Options: `--stroke-color`, `--background-color`, `--stroke-width`, `--stroke-style`, `--fill-style`, `-l/--label`

### Add Text
```bash
agent-canvas add-text -t "<text>" -x <x> -y <y> [--font-size <size>] [--text-align <align>]
```

### Add Lines and Arrows
```bash
agent-canvas add-line -x <x> -y <y> --end-x <x2> --end-y <y2> [options]
agent-canvas add-arrow -x <x> -y <y> --end-x <x2> --end-y <y2> [options]
```
- Options: `--stroke-color`, `--stroke-width`, `--stroke-style`
- Arrow options: `--start-arrowhead`, `--end-arrowhead` (arrow, bar, dot, triangle, diamond, none)

### Add Polygon
```bash
agent-canvas add-polygon -p '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]' [options]
```

### Manipulate Elements
```bash
agent-canvas delete-elements -i <id1>,<id2>,...
agent-canvas rotate-elements -i <id1>,<id2>,... -a <degrees>
agent-canvas move-elements -i <id1>,<id2>,... --delta-x <dx> --delta-y <dy>
agent-canvas group-elements -i <id1>,<id2>,...
agent-canvas ungroup-element -i <id>
```

### Read and Export
```bash
agent-canvas read              # Read scene (TOON format)
agent-canvas read --json       # Read scene (JSON)
agent-canvas save file.excalidraw
agent-canvas export -o out.png [--scale 2] [--dark] [--no-background]
```

## Usage Tips

1. **Coordinate System**: Origin (0,0) is top-left. X increases rightward, Y increases downward.

2. **Colors**: Use hex format like `#FF5733` or `transparent`.

3. **Workflow**:
   - Start canvas first: `agent-canvas start`
   - Draw elements using add-* commands
   - Read the scene to get element IDs: `agent-canvas read`
   - Use IDs to manipulate elements

4. **Common Patterns**:
   - Flowchart: Use rectangles + arrows
   - Architecture: Use rectangles + labels + arrows
   - Mind map: Use ellipses + lines radiating from center

5. **Batch Commands**: Chain multiple commands with `&&` to reduce tool calls and draw faster. Optionally add `sleep 0.3` between some commands for an animation-like effect:
   ```bash
   agent-canvas add-shape -t rectangle -x 100 -y 100 -l "A" && \
   agent-canvas add-shape -t rectangle -x 300 -y 100 -l "B" && sleep 0.3 && \
   agent-canvas add-arrow -x 220 -y 130 --end-x 300 --end-y 130
   ```

## Example: Simple Flowchart

```bash
# Start canvas
agent-canvas start &

# Add boxes
agent-canvas add-shape -t rectangle -x 100 -y 50 -w 120 -h 60 -l "Start"
agent-canvas add-shape -t rectangle -x 100 -y 150 -w 120 -h 60 -l "Process"
agent-canvas add-shape -t diamond -x 100 -y 280 -w 120 -h 80 -l "Decision"
agent-canvas add-shape -t rectangle -x 100 -y 400 -w 120 -h 60 -l "End"

# Add arrows connecting them
agent-canvas add-arrow -x 160 -y 110 --end-x 160 --end-y 150
agent-canvas add-arrow -x 160 -y 210 --end-x 160 --end-y 280
agent-canvas add-arrow -x 160 -y 360 --end-x 160 --end-y 400
```

## More Examples

See [references/REFERENCE.md](references/REFERENCE.md) for tutorials on drawing different types of diagrams.
