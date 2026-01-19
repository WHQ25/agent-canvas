# Agent Canvas

A CLI tool that provides an Excalidraw canvas interface for AI agents.

## Features

- Electron-based desktop app with embedded Excalidraw
- CLI for AI agents to interact with the canvas via WebSocket
- Full drawing capabilities: shapes, text, lines, arrows, polygons
- Element manipulation: move, rotate, group, delete
- File I/O: load and save .excalidraw files
- PNG export with scale, dark mode, and embed scene options
- Chinese handwriting font (Xiaolai) support

## Requirements

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 18 (for Electron)

## Installation

```bash
# Install dependencies
bun install

# Build all packages
bun run build
```

## Development

```bash
# Start all packages in dev mode
bun run dev

# Or start individually
cd packages/electron-app && bun run dev
cd packages/cli && bun run dev start
```

## Usage

### Start Canvas

```bash
# Start empty canvas
canvas start

# Start and load existing file
canvas start --file diagram.excalidraw
```

### Drawing

```bash
# Add shapes
canvas add-shape -t rectangle -x 100 -y 100 -w 200 -h 100 --background-color "#FFA07A" -l "My Box"
canvas add-shape -t ellipse -x 300 -y 100 -w 100 -h 100
canvas add-shape -t diamond -x 500 -y 100 -w 100 -h 100

# Add text
canvas add-text -t "Hello World" -x 100 -y 300 --font-size 24

# Add lines and arrows
canvas add-line -x 100 -y 400 --end-x 300 --end-y 400
canvas add-arrow -x 100 -y 500 --end-x 300 --end-y 500

# Add polygon
canvas add-polygon -p '[{"x":0,"y":0},{"x":100,"y":0},{"x":50,"y":100}]'
```

### Element Manipulation

```bash
# Delete element
canvas delete-element -i <element-id>

# Rotate element (degrees, positive = clockwise)
canvas rotate-element -i <element-id> -a 45

# Move elements
canvas move-elements -i <id1>,<id2> --delta-x 50 --delta-y 100

# Group/ungroup
canvas group-elements -i <id1>,<id2>,<id3>
canvas ungroup-element -i <element-id>
```

### Read & Export

```bash
# Read scene (TOON format - token efficient)
canvas read

# Read scene (JSON format)
canvas read --json

# Save to file
canvas save diagram.excalidraw

# Export to PNG
canvas export -o output.png
canvas export -o output.png --scale 2 --dark --no-background
```

## Project Structure

```
agent-canvas/
├── packages/
│   ├── electron-app/    # Electron + Excalidraw desktop app
│   │   ├── src/
│   │   │   ├── main/    # Electron main process + WebSocket server
│   │   │   ├── renderer/# React + Excalidraw
│   │   │   └── shared/  # Protocol types
│   │   └── public/      # Excalidraw fonts and assets
│   └── cli/             # Command-line interface
│       └── src/
│           ├── commands/# CLI commands
│           └── lib/     # WebSocket client
├── turbo.json           # Turborepo configuration
└── package.json         # Root package.json
```

## License

MIT
