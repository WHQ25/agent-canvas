# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Canvas is a CLI tool that provides an Excalidraw canvas interface for AI agents. It consists of three packages in a Turborepo monorepo:

- **web-app**: Browser frontend with Excalidraw (for browser mode)
- **electron-app**: Electron desktop application embedding Excalidraw (for `--app` mode)
- **cli**: Command-line interface with built-in HTTP/WebSocket server for browser mode

## Tech Stack

- **Package Manager**: Bun
- **Monorepo**: Turborepo
- **Electron App**: Electron + Vite + React + @excalidraw/excalidraw (0.18.0)
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

### Browser Mode (default)

CLI commands → WebSocket → CLI Server → WebSocket → Browser (Excalidraw)

```
CLI (ws-client) <--WebSocket:7890--> CLI Server (relay) <--WebSocket:7890--> Browser
                                           |
                                    HTTP:7891 (static files)
```

- HTTP server serves web-app static files on port **7891**
- WebSocket server relays messages on port **7890**
- Browser connects as WebSocket client, identified by `browserConnect` message

### Electron Mode (`--app`)

CLI and Electron app communicate via WebSocket on port **7890**.

```
CLI (ws-client) <--WebSocket:7890--> Electron Main Process (ws-server)
                                            |
                                            v (IPC)
                                    Renderer (Excalidraw)
```

### Protocol

Messages are defined in `electron-app/src/shared/protocol.ts` and follow a typed message pattern with `type` discriminator. Each request has an `id` for response matching.

## CLI Commands

### Application Control
- `canvas start` - Start in browser mode (default)
- `canvas start --app` - Start in Electron mode
- `canvas start -f <path>` - Load .excalidraw file on start

### Drawing Commands
- `canvas add-shape -t <rectangle|ellipse|diamond> -x <n> -y <n>` - Add shape
- `canvas add-text -t <text> -x <n> -y <n>` - Add text
- `canvas add-line -x <n> -y <n> --end-x <n> --end-y <n>` - Add line
- `canvas add-arrow -x <n> -y <n> --end-x <n> --end-y <n>` - Add arrow
- `canvas add-polygon -p '<json-points>'` - Add polygon

### Element Manipulation
- `canvas delete-element -i <id>` - Delete element
- `canvas rotate-element -i <id> -a <degrees>` - Rotate element
- `canvas move-elements -i <ids> --delta-x <n> --delta-y <n>` - Move elements
- `canvas group-elements -i <ids>` - Group elements
- `canvas ungroup-element -i <id>` - Ungroup element

### Scene Operations
- `canvas read` - Read scene (TOON format)
- `canvas read --json` - Read scene (JSON format)
- `canvas save <filepath>` - Save to .excalidraw file
- `canvas export -o <path>` - Export to PNG

## Drawing Tips for Agents

When drawing complex diagrams, chain commands with `&&` for efficiency:

```bash
bun run dev add-shape -t rectangle -x 100 -y 100 -w 200 -h 100 -l "Box 1" && \
bun run dev add-shape -t rectangle -x 100 -y 250 -w 200 -h 100 -l "Box 2" && \
bun run dev add-arrow -x 200 -y 200 --end-x 200 --end-y 250
```

## Key Files

| File | Purpose |
|------|---------|
| `cli/src/index.ts` | CLI commands |
| `cli/src/server/index.ts` | HTTP + WebSocket server (browser mode) |
| `cli/src/commands/start.ts` | Start command (browser/Electron mode) |
| `cli/src/lib/ws-client.ts` | WebSocket client |
| `web-app/src/App.tsx` | Browser mode Excalidraw + WebSocket |
| `electron-app/src/shared/protocol.ts` | WebSocket message types |
| `electron-app/src/renderer/App.tsx` | Electron mode Excalidraw + IPC |
| `electron-app/src/main/ws-server.ts` | Electron WebSocket server |
