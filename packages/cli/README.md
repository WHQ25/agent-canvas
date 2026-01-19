# @agent-canvas/cli

A CLI tool that provides an Excalidraw canvas interface for AI agents.

## Installation

```bash
npm install -g @agent-canvas/cli
```

## Features

- **Browser mode** (default): Opens Excalidraw in your browser
- **Electron mode** (optional): Desktop app with `--app` flag
- Full drawing capabilities: shapes, text, lines, arrows, polygons
- Element manipulation: move, rotate, group, delete
- File I/O: load and save .excalidraw files
- PNG export with scale, dark mode, and embed scene options

## Usage

### Start Canvas

```bash
# Browser mode (default)
agent-canvas start
agent-canvas start -f diagram.excalidraw

# Electron mode (requires @agent-canvas/electron-app)
agent-canvas start --app
```

### Drawing

```bash
# Add shapes
agent-canvas add-shape -t rectangle -x 100 -y 100 -w 200 -h 100 --background-color "#FFA07A" -l "My Box"
agent-canvas add-shape -t ellipse -x 300 -y 100 -w 100 -h 100
agent-canvas add-shape -t diamond -x 500 -y 100 -w 100 -h 100

# Add text
agent-canvas add-text -t "Hello World" -x 100 -y 300 --font-size 24

# Add lines and arrows
agent-canvas add-line -x 100 -y 400 --end-x 300 --end-y 400
agent-canvas add-arrow -x 100 -y 500 --end-x 300 --end-y 500

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
```

## License

MIT
