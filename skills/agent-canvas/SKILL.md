---
name: agent-canvas
description: Draw diagrams, flowcharts, and visualizations on an Excalidraw canvas. Use when the user asks to draw, visualize, create diagrams, or sketch ideas.
allowed-tools: Bash(agent-canvas:*)
license: MIT
metadata:
  author: WHQ25
  version: "0.2.1"
  repository: https://github.com/WHQ25/agent-canvas
---

# Agent Canvas

A CLI tool to interact with an Excalidraw canvas for creating diagrams and visualizations.

## Installation

Before using, check if CLI is installed and version matches:

```bash
agent-canvas --version  # Should output: 0.2.0
```

- If not installed or version differs, install/upgrade:
  ```bash
  npm install -g @agent-canvas/cli@0.2.0
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
agent-canvas start                    # Start server and open browser
agent-canvas start -f file.excalidraw # Load existing file on start
```

### Add Text
```bash
agent-canvas add-text -t "<text>" -x <x> -y <y> [options]
```
- Options: `--font-size <size>`, `--text-align <left|center|right>`, `-n/--note`
- Font sizes: S=16, M=20 (default), L=28, XL=36

### Add Drawing Elements

All drawing commands share common style options:
- **Stroke**: `--stroke-color <hex>` (default: #1e1e1e), `--stroke-width <1-4>` (default: 2), `--stroke-style <solid|dashed|dotted>` (default: solid)
- **Fill** (shapes only): `--background-color <hex>` (default: transparent), `--fill-style <solid|hachure|cross-hatch>` (default: solid)
- **Meta**: `-n/--note <text>` - semantic description for the element. **Use liberally** - notes help understand diagram intent when reading back later.

**Recommended Colors** (from Excalidraw palette):
| Color  | Stroke (dark) | Background (light) |
|--------|---------------|-------------------|
| Red    | #e03131       | #ffc9c9           |
| Blue   | #1971c2       | #a5d8ff           |
| Green  | #2f9e44       | #b2f2bb           |
| Yellow | #f08c00       | #ffec99           |
| Cyan   | #0c8599       | #99e9f2           |
| Violet | #6741d9       | #b197fc           |
| Gray   | #495057       | #dee2e6           |

#### Shapes
```bash
agent-canvas add-shape -t <type> -x <x> -y <y> [-w <width>] [-h <height>] [-l <label>]
```
- Types: `rectangle`, `ellipse`, `diamond`
- Use `-l/--label` to add text inside the shape (fontSize: S=16 by default), label text will appear in the center of the shape, consider potential element overlapping.

#### Lines & Arrows
```bash
agent-canvas add-line -x <x1> -y <y1> --end-x <x2> --end-y <y2>
agent-canvas add-arrow -x <x1> -y <y1> --end-x <x2> --end-y <y2>
```
- Arrow-specific: `--start-arrowhead`, `--end-arrowhead` (arrow, bar, dot, triangle, diamond, none)

#### Polygon
```bash
agent-canvas add-polygon -p '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]'
```

### Manipulate Elements
```bash
agent-canvas delete-elements -i <id1>,<id2>,...
agent-canvas rotate-elements -i <id1>,<id2>,... -a <degrees>
agent-canvas move-elements -i <id1>,<id2>,... --delta-x <dx> --delta-y <dy>
agent-canvas group-elements -i <id1>,<id2>,...
agent-canvas ungroup-element -i <id>
```

### Read Scene
```bash
agent-canvas read                # TOON format (compact, ~7% of JSON size)
agent-canvas read --with-style   # Include stroke/bg colors
agent-canvas read --json         # Raw Excalidraw scene JSON
```

**TOON output structure:**
```
shapes[N]{id,type,x,y,w,h,angle,labelId,note}       # rectangle, ellipse, diamond, polygon
lines[N]{id,type,x,y,endX,endY,points,angle,note}   # line, arrow
labels[N]{id,containerId,content,x,y,w,h}           # text bound to shapes (via labelId)
texts[N]{id,content,x,y,w,h,angle}                   # standalone text elements
groups[N]{id,elementIds}                             # element groupings
```

- `labelId` in shapes links to `id` in labels
- `--with-style` adds `stroke`, `bg` fields
- `--json` returns full Excalidraw format (use with `jq` to query specific elements)

### Save and Export
```bash
agent-canvas save file.excalidraw
agent-canvas export -o out.png [--scale 2] [--dark] [--no-background]
```

## Design Philosophy

**You are a perfectionist with obsessive attention to detail and refined aesthetic sensibility.**

When creating diagrams, embody these principles:

### Alignment is Sacred
- Every element MUST align perfectly with related elements
- Use consistent X coordinates for vertical alignment, Y coordinates for horizontal alignment
- Center points of connected elements should form clean lines (vertical, horizontal, or 45°)
- Before drawing, calculate the grid: pick a base unit (e.g., 50px) and snap everything to it

### Spacing is Rhythm
- **Same-level elements**: identical gaps (e.g., all sibling nodes 100px apart)
- **Hierarchical spacing**: parent-to-child distance > sibling distance
- **Edge padding**: maintain consistent margins from canvas edges and container boundaries
- Golden ratio (1.618) for pleasing proportions: if width is 100, height could be 62

### Color is Communication
- **Limit palette**: max 3-4 colors per diagram, use the recommended palette
- **Semantic consistency**: same color = same meaning throughout the diagram
- **Contrast matters**: ensure text is readable against backgrounds
- **Less is more**: when in doubt, use fewer colors, not more

### Size is Hierarchy
- **Consistent dimensions**: all nodes of the same type should have identical width/height
- **Visual hierarchy**: more important = larger; less important = smaller
- **Proportional scaling**: if one element is 120x60, related elements should share these dimensions

### Balance is Harmony
- **Visual weight**: distribute elements evenly across the canvas
- **Symmetry when appropriate**: flowcharts often benefit from centered, symmetric layouts
- **Whitespace is intentional**: empty space guides the eye and reduces cognitive load

### Details are Everything
- **Arrow endpoints**: connect to shape edges precisely, not floating in space
- **Label positioning**: centered within shapes, no overflow
- **No orphans**: every element should have clear visual relationships
- **Review ruthlessly**: after drawing, `export` and visually inspect—fix any imperfection

**Mantra**: *"If it looks slightly off, it IS off. Fix it."*

## Usage Tips

1. **Coordinate System**: Origin (0,0) is top-left. X increases rightward, Y increases downward.

2. **Colors**: Use hex format like `#FF5733` or `transparent`.

3. **Read → Plan → Draw**:
   1. Read canvas & understand existing elements
   2. Plan layout & calculate coordinates to avoid overlap
   3. Draw via agent-canvas CLI

4. **Progressive Canvas Reading**: When understanding a canvas, use incremental detail levels:
   1. `read` - Start here. Compact TOON format shows structure, positions, and relationships (~7% of JSON size)
   2. `read --with-style` - Add color info if visual styling matters
   3. `export -o canvas.png` + read the image - For visual/spatial understanding
   4. `read --json | jq '.elements[] | select(.id=="<id>")'` - Query specific element details when needed

5. **Batch Commands**: Chain multiple commands with `&&` to draw faster.
   - **IMPORTANT**: Do NOT use comments (`#`) in chained commands - they don't work well with bash permission system.
   - For diagrams with <50 elements, batch all commands in a single chain
   - Optionally add `sleep 0.2` between commands for animation effect
   ```bash
   agent-canvas add-shape -t rectangle -x 100 -y 100 -l "A" -n "Node A: entry point" && \
   agent-canvas add-shape -t rectangle -x 300 -y 100 -l "B" -n "Node B: processing" && \
   agent-canvas add-arrow -x 220 -y 130 --end-x 300 --end-y 130 -n "A to B data flow"
   ```

## Example: Simple Flowchart

```bash
agent-canvas start &
```

```bash
agent-canvas add-shape -t rectangle -x 100 -y 50 -w 120 -h 60 -l "Start" -n "Flow begins here" && \
agent-canvas add-shape -t rectangle -x 100 -y 150 -w 120 -h 60 -l "Process" -n "Main processing step" && \
agent-canvas add-shape -t diamond -x 100 -y 280 -w 120 -h 80 -l "Decision" -n "Branch condition check" && \
agent-canvas add-shape -t rectangle -x 100 -y 400 -w 120 -h 60 -l "End" -n "Flow terminates" && \
agent-canvas add-arrow -x 160 -y 110 --end-x 160 --end-y 150 -n "Start to Process" && \
agent-canvas add-arrow -x 160 -y 210 --end-x 160 --end-y 280 -n "Process to Decision" && \
agent-canvas add-arrow -x 160 -y 360 --end-x 160 --end-y 400 -n "Decision to End (yes branch)"
```

## More Drawing Guide

See [references/REFERENCE.md](references/REFERENCE.md) for tutorials on drawing different types of diagrams.