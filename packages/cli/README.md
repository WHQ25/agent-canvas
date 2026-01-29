# @agent-canvas/cli

CLI tool for drawing on Excalidraw canvas. Designed for AI agents but works great for humans too.

Part of [Agent Canvas](https://github.com/WHQ25/agent-canvas) — an AI agent skill for drawing diagrams.

## Installation

```bash
npm install -g @agent-canvas/cli
# or
bun add -g @agent-canvas/cli
```

## Features

- Real-time canvas in browser via WebSocket
- Multi-canvas support: manage multiple diagrams with sidebar or CLI
- Shapes: rectangle, ellipse, diamond, polygon
- Text with 9 anchor points for precise positioning
- Arrows: sharp, round (curved), elbow (90° turns)
- Element manipulation: move, rotate, resize, group, delete
- Import/export: .excalidraw files, PNG export

## Usage

### Start Canvas

```bash
agent-canvas start
```

### Load File

```bash
agent-canvas load diagram.excalidraw  # Load into current canvas
```

### Canvas Management

```bash
# List all canvases (* marks active)
agent-canvas list

# Create new canvas
agent-canvas new -n "Flowchart"
agent-canvas new -n "Architecture" --use  # Create and switch to it

# Switch to canvas by name
agent-canvas use "Flowchart"

# Rename current canvas
agent-canvas rename "New Name"
```

### Drawing

```bash
# Add shapes
agent-canvas add-shape -t rectangle -x 100 -y 100 -w 200 -h 100 --background-color "#FFA07A" -l "My Box"
agent-canvas add-shape -t ellipse -x 300 -y 100 -w 100 -h 100
agent-canvas add-shape -t diamond -x 500 -y 100 -w 100 -h 100

# Add text (--ax/--ay = anchor point, -a = anchor type)
agent-canvas add-text -t "Hello World" --ax 100 --ay 300 --font-size 24
agent-canvas add-text -t "Centered" --ax 200 --ay 250 -a center
# Anchors: topLeft, topCenter, topRight, leftCenter, center, rightCenter, bottomLeft, bottomCenter (default), bottomRight

# Add lines and arrows
agent-canvas add-line -x 100 -y 400 --end-x 300 --end-y 400
agent-canvas add-arrow -x 100 -y 500 --end-x 300 --end-y 500

# Arrow types: sharp (default), round, elbow
agent-canvas add-arrow -x 100 -y 100 --end-x 100 --end-y 300 --arrow-type round --via "50,200"
agent-canvas add-arrow -x 175 -y 520 --end-x 175 --end-y 280 --arrow-type elbow --via "120,520;120,280"

# Add polygon
agent-canvas add-polygon -p '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]'
```

### Element Manipulation

```bash
# Delete elements (supports batch)
agent-canvas delete-elements -i <id1>,<id2>,<id3>

# Rotate elements (degrees, positive = clockwise)
agent-canvas rotate-elements -i <id1>,<id2> -a 45

# Move elements
agent-canvas move-elements -i <id1>,<id2> --delta-x 50 --delta-y 100

# Resize shapes (expand/contract edges)
agent-canvas resize-elements -i <id> --bottom 50              # Expand bottom by 50px
agent-canvas resize-elements -i <id> --right 30 --bottom 20   # Expand right-bottom corner
agent-canvas resize-elements -i <id> --left -20               # Contract left edge by 20px

# Group/ungroup
agent-canvas group-elements -i <id1>,<id2>,<id3>
agent-canvas ungroup-element -i <element-id>
```

### Read & Export

```bash
# Read scene (TOON format - token efficient)
agent-canvas read

# Read scene (JSON format)
agent-canvas read --json

# Save to file
agent-canvas save diagram.excalidraw

# Export to PNG
agent-canvas export -o output.png
agent-canvas export -o output.png --scale 2 --dark --no-background

# Clear canvas
agent-canvas clear
```