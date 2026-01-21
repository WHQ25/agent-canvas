# Agent Canvas

An AI agent skill for drawing diagrams, flowcharts, and visualizations. Give your agents an Excalidraw canvas and see what they can do!

## Installation

```bash
npx add-skill WHQ25/agent-canvas --skill agent-canvas
```

This installs the skill to your AI coding agent (Claude Code, Codex, Cursor, etc.).

After installation, just ask your agent to draw something:
- "Draw a flowchart for user authentication"
- "Create an architecture diagram for a microservices system"
- "Sketch a mind map for project planning"

## How It Works

The skill teaches AI agents how to use the `@agent-canvas/cli` tool to draw on an Excalidraw canvas in your browser.

```
You → AI Agent → agent-canvas CLI → Browser (Excalidraw)
```

## CLI Installation

The skill will guide the agent to install the CLI automatically. You can also install it manually:

```bash
npm install -g @agent-canvas/cli
```

## Features

- **Browser-based**: Opens Excalidraw in your browser
- **Full drawing capabilities**: shapes, text, lines, arrows, polygons
- **Element manipulation**: move, rotate, group, delete
- **File I/O**: load and save .excalidraw files
- **PNG export**: with scale, dark mode, and embed scene options

## Contributing

Contributions are welcome!

The skill is located in `skills/agent-canvas/`:

- `SKILL.md` - CLI command reference (how to use each command)
- `references/` - Drawing tutorials for specific diagram types (flowcharts, UI mockups, etc.)

**How to contribute:**

1. Add new drawing tutorials to `skills/agent-canvas/references/`
2. Improve the CLI tool in `packages/cli/`
3. Report issues or suggest features

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run in dev mode (starts both web-app and CLI server)
bun run dev

# Run CLI commands during development
bun dev:cli <command>
# Example: bun dev:cli start
# Example: bun dev:cli add-shape -t rectangle -x 100 -y 100
```