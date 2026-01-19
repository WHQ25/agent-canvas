# @agent-canvas/electron-app

Electron desktop app for Agent Canvas - Excalidraw interface for AI agents.

## Installation

```bash
npm install -g @agent-canvas/electron-app
```

This package is optional. Use it if you prefer a desktop app instead of the browser.

## Usage

After installing, you can use the `--app` flag with the CLI:

```bash
# Start canvas in Electron app
agent-canvas start --app

# Load a file
agent-canvas start --app -f diagram.excalidraw
```

Or run directly:

```bash
agent-canvas-app
```

## Requirements

- Node.js >= 18
- @agent-canvas/cli (for full functionality)

## Features

- Native desktop application
- Offline support
- Chinese handwriting font (Xiaolai) included
- WebSocket server for CLI integration

## License

MIT
