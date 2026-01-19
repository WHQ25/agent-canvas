# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Canvas is a CLI tool that provides an Excalidraw canvas interface for AI agents. It consists of two packages in a Turborepo monorepo:

- **electron-app**: Electron desktop application embedding Excalidraw with a WebSocket server
- **cli**: Command-line interface for controlling the canvas

## Tech Stack

- **Package Manager**: Bun
- **Monorepo**: Turborepo
- **Electron App**: Electron + Vite + React + @excalidraw/excalidraw
- **CLI**: Commander.js + ws (WebSocket client)
- **Language**: TypeScript

## Development Commands

```bash
# Install dependencies (from root)
bun install

# Run all packages in dev mode
bun run dev

# Run specific package
bun run dev --filter=electron-app
bun run dev --filter=@agent-canvas/cli

# Build all packages
bun run build

# Type check
bun run typecheck
```

## Architecture

### Communication

CLI and Electron app communicate via WebSocket on port **7890**.

```
CLI (ws-client) <--WebSocket:7890--> Electron Main Process (ws-server)
                                            |
                                            v
                                    Renderer (Excalidraw)
```

### Protocol

Messages are defined in `electron-app/src/shared/protocol.ts` and follow a typed message pattern with `type` discriminator.

### CLI Commands

- `canvas start` - Launch Electron app (if not running) and establish WebSocket connection
