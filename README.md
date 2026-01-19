# Agent Canvas

A CLI tool that provides an Excalidraw canvas interface for AI agents.

## Features

- Electron-based desktop app with embedded Excalidraw
- CLI for AI agents to interact with the canvas
- WebSocket communication between CLI and desktop app

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

```bash
# Start the canvas app
canvas start
```

## Project Structure

```
agent-canvas/
├── packages/
│   ├── electron-app/    # Electron + Excalidraw desktop app
│   └── cli/             # Command-line interface
├── turbo.json           # Turborepo configuration
└── package.json         # Root package.json
```

## License

MIT
