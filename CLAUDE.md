# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Canvas is an AI agent skill + CLI tool that provides an Excalidraw canvas interface for AI agents. It consists of:

- **skills/agent-canvas/**: Agent skill (teaches AI agents how to use the CLI)
- **packages/**: NPM packages in a Turborepo monorepo
  - **web-app**: Browser frontend with Excalidraw
  - **cli**: Command-line interface with built-in HTTP/WebSocket server

## Tech Stack

- **Package Manager**: Bun
- **Monorepo**: Turborepo
- **Web App**: Vite + React + @excalidraw/excalidraw (0.18.0)
- **CLI**: Commander.js + ws (WebSocket client)
- **Language**: TypeScript

## Development Commands

```bash
# Install dependencies (from root)
bun install

# Start dev server (Vite HMR + WS relay, auto-opens browser)
bun run dev

# Run CLI commands during development (use this instead of global `agent-canvas`)
bun dev:cli <command>
# Example: bun dev:cli add-shape -t rectangle -x 100 -y 100

# Build all packages
bun run build

# Type check
bun run typecheck
```

**Important**: When developing, always use `bun dev:cli` instead of the globally installed `agent-canvas` command. The global version is the published release and won't include your local changes.

### Dev Mode (`start --dev`)

`bun run dev` (or `bun dev:cli start --dev`) starts a development server with Vite HMR:

- WS relay on port **7900** (dev default, overridable via `AGENT_CANVAS_WS_PORT`)
- Vite dev server on port **5173** (Vite default) with hot module replacement
- No `bun run build` needed — web-app changes auto-reload in browser

| | WS Port | HTTP Port |
|---|---|---|
| Production (`start`) | 7890 | 7891 |
| Dev (`start --dev`) | 7900 | 5173 (Vite) |

**Workflow:**
1. Run `bun run dev` to start dev server (Vite HMR + WS relay)
2. Make code changes in `packages/web-app/src/` — browser auto-reloads
3. For CLI changes in `packages/cli/src/`, restart the dev server
4. Test CLI commands with `bun dev:cli <command>`

## Architecture

```
CLI (ws-client) <--WebSocket:7890--> CLI Server (relay) <--WebSocket:7890--> Browser
                                           |
                                    HTTP:7891 (static files)
```

- HTTP server serves web-app static files on port **7891**
- WebSocket server relays messages on port **7890**
- Browser connects as WebSocket client, identified by `browserConnect` message

### Protocol

Messages are defined in `cli/src/lib/protocol.ts` and follow a typed message pattern with `type` discriminator. Each request has an `id` for response matching.

## CLI Commands

### Application Control
- `agent-canvas start` - Start server and open browser
- `agent-canvas start --dev` - Dev mode: Vite HMR + WS relay (no build needed)
- `agent-canvas load <path>` - Load .excalidraw file into current canvas

### Canvas Management
- `agent-canvas list` - List all canvases (* marks active)
- `agent-canvas new -n <name> [--use]` - Create new canvas, optionally switch to it
- `agent-canvas use <name>` - Switch to canvas by name
- `agent-canvas rename <name>` - Rename current canvas

### Drawing Commands
- `agent-canvas add-shape -t <rectangle|ellipse|diamond> -x <n> -y <n>` - Add shape
- `agent-canvas add-text -t <text> -x <n> -y <n>` - Add text
- `agent-canvas add-line -x <n> -y <n> --end-x <n> --end-y <n>` - Add line
- `agent-canvas add-arrow -x <n> -y <n> --end-x <n> --end-y <n>` - Add arrow
- `agent-canvas add-polygon -p '<json-points>'` - Add polygon

### Element Manipulation
- `agent-canvas delete-elements -i <ids>` - Delete elements (batch)
- `agent-canvas rotate-elements -i <ids> -a <degrees>` - Rotate elements (batch)
- `agent-canvas move-elements -i <ids> --delta-x <n> --delta-y <n>` - Move elements
- `agent-canvas resize-elements -i <ids> [--top <n>] [--bottom <n>] [--left <n>] [--right <n>]` - Resize shapes
- `agent-canvas group-elements -i <ids>` - Group elements
- `agent-canvas ungroup-element -i <id>` - Ungroup element

### Scene Operations
- `agent-canvas read` - Read scene (TOON format)
- `agent-canvas read --json` - Read scene (JSON format)
- `agent-canvas save <filepath>` - Save to .excalidraw file
- `agent-canvas export -o <path>` - Export to PNG
- `agent-canvas clear` - Clear all elements from the canvas

## Drawing Tips for Agents

When drawing complex diagrams, chain commands with `&&` for efficiency:

```bash
bun dev:cli add-shape -t rectangle -x 100 -y 100 -w 200 -h 100 -l "Box 1" && \
bun dev:cli add-shape -t rectangle -x 100 -y 250 -w 200 -h 100 -l "Box 2" && \
bun dev:cli add-arrow -x 200 -y 200 --end-x 200 --end-y 250
```

## Key Files

| File | Purpose |
|------|---------|
| `cli/src/index.ts` | CLI commands |
| `cli/src/server/index.ts` | HTTP + WebSocket server |
| `cli/src/commands/start.ts` | Start command |
| `cli/src/lib/ws-client.ts` | WebSocket client |
| `cli/src/lib/protocol.ts` | WebSocket message types |
| `web-app/src/App.tsx` | Excalidraw + WebSocket handler |
| `skills/agent-canvas/SKILL.md` | Agent skill - CLI command reference |
| `skills/agent-canvas/references/` | Drawing tutorials for diagram types |

## Agent Skill Structure

```
skills/agent-canvas/
├── SKILL.md              # CLI command reference (main skill file)
└── references/
    ├── REFERENCE.md      # Tutorial index
    ├── flowchart.md      # Flowchart tutorial
    ├── architecture.md   # Architecture diagram tutorial
    ├── mindmap.md        # Mind map tutorial
    └── ui-mockup.md      # UI mockup tutorial
```

## Version Bump Checklist

### CLI Version (when CLI code changes)
1. `packages/cli/package.json` - version field
2. `packages/cli/src/index.ts` - `.version('x.x.x')` (hardcoded)
3. `skills/agent-canvas/SKILL.md` - Installation section (CLI version in install commands)

### Skill Version (when SKILL.md or references change)
1. `skills/agent-canvas/SKILL.md` - metadata `version` field only

## Reference Tutorial Optimization Workflow

When optimizing drawing tutorials in `skills/agent-canvas/references/`, use this iterative workflow:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Read current tutorial                                   │
│     - Read SKILL.md + references/<type>.md                  │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Subagent test                                           │
│     - Use Task tool to launch a subagent                    │
│     - Subagent reads ONLY the docs, draws a test diagram    │
│     - Subagent has isolated context (not polluted)          │
│     - Ask subagent to report: commands executed, any issues │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Evaluate result                                         │
│     - Export PNG and visually inspect                       │
│     - Check: alignment, colors, arrows, layout, aesthetics  │
│     - Record issues found                                   │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Optimize documentation                                  │
│     - Update SKILL.md or references/<type>.md               │
│     - Add rules, examples, or clarifications                │
│     - Clear canvas, go back to step 2                       │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Repeat until satisfied                                  │
│     - Test with simple and complex diagrams                 │
│     - Commit changes when quality is good                   │
└─────────────────────────────────────────────────────────────┘
```

**Key principles:**
- Subagent isolation ensures unbiased testing (no prior context pollution)
- Debug by asking subagent to report executed commands and size calculations
- Use `agent-canvas read` to verify actual vs specified dimensions
- Test both simple and complex scenarios before committing
