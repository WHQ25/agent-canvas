# Agent Canvas

An AI agent skill for drawing diagrams, flowcharts, and visualizations on an Excalidraw canvas.

## Install Skill

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

- **Browser mode**: Opens Excalidraw in your browser - no extra installation required
- **Full drawing capabilities**: shapes, text, lines, arrows, polygons
- **Element manipulation**: move, rotate, group, delete
- **File I/O**: load and save .excalidraw files
- **PNG export**: with scale, dark mode, and embed scene options

## Usage Examples

See the [references folder](skills/agent-canvas/references/) for detailed examples:

- [Flowcharts](skills/agent-canvas/references/flowchart.md) - Process flows, decision trees
- [Architecture Diagrams](skills/agent-canvas/references/architecture.md) - System design, microservices
- [Mind Maps](skills/agent-canvas/references/mindmap.md) - Brainstorming, project planning

## Contributing

Contributions are welcome! You can:

1. Add new diagram examples to `skills/agent-canvas/references/`
2. Improve the CLI tool in `packages/cli/`
3. Report issues or suggest features

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run in dev mode
bun run dev
```

## License

MIT
