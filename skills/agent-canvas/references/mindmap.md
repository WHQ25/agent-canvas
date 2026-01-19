# Mind Map

Tutorials for creating mind maps, brainstorming diagrams, and idea organization.

## Design Principles

### Node Types
- **Ellipse** - Central topic (larger, prominent)
- **Rectangle** - Main branches
- **Text** - Sub-items and details

### Color Palette
Use different colors for each branch to improve readability:
- Central: `#FFD700` (gold)
- Branch 1: `#87CEEB` (light blue)
- Branch 2: `#98FB98` (light green)
- Branch 3: `#DDA0DD` (light purple)
- Branch 4: `#FFB6C1` (light pink)

### Standard Sizes
- Central topic: 140-160x70-80
- Main branches: 100-120x40-50
- Spacing from center: 150-200px

### Connection Type
- Use **lines** (not arrows) for mind map connections
- Lines radiate outward from the central topic

## Drawing Order

1. **Central topic first** - Place it at the center of the canvas
2. **Main branches** - Add around the center (top, bottom, left, right)
3. **Connections** - Draw lines from center to each branch
4. **Sub-items** - Add text elements near branches

## Examples

### Basic Mind Map

```bash
# Central topic
agent-canvas add-shape -t ellipse -x 250 -y 200 -w 150 -h 70 -l "Main Topic" --background-color "#FFD700" && sleep 0.3 && \

# Branches (4 directions)
agent-canvas add-shape -t rectangle -x 80 -y 80 -w 110 -h 45 -l "Branch 1" --background-color "#87CEEB" && \
agent-canvas add-shape -t rectangle -x 420 -y 80 -w 110 -h 45 -l "Branch 2" --background-color "#98FB98" && \
agent-canvas add-shape -t rectangle -x 80 -y 320 -w 110 -h 45 -l "Branch 3" --background-color "#DDA0DD" && \
agent-canvas add-shape -t rectangle -x 420 -y 320 -w 110 -h 45 -l "Branch 4" --background-color "#FFB6C1" && sleep 0.3 && \

# Connections (lines, not arrows)
agent-canvas add-line -x 250 -y 200 --end-x 135 --end-y 125 && \
agent-canvas add-line -x 400 -y 200 --end-x 420 --end-y 125 && \
agent-canvas add-line -x 250 -y 270 --end-x 135 --end-y 320 && \
agent-canvas add-line -x 400 -y 270 --end-x 420 --end-y 320
```

### Project Planning Mind Map

```bash
# Center
agent-canvas add-shape -t ellipse -x 250 -y 220 -w 150 -h 70 -l "Project X" --background-color "#FFD700" && sleep 0.3 && \

# Main branches
agent-canvas add-shape -t rectangle -x 80 -y 60 -w 100 -h 40 -l "Goals" --background-color "#87CEEB" && \
agent-canvas add-shape -t rectangle -x 420 -y 60 -w 100 -h 40 -l "Timeline" --background-color "#98FB98" && \
agent-canvas add-shape -t rectangle -x 80 -y 380 -w 100 -h 40 -l "Resources" --background-color "#DDA0DD" && \
agent-canvas add-shape -t rectangle -x 420 -y 380 -w 100 -h 40 -l "Risks" --background-color "#FFB6C1" && sleep 0.3 && \

# Sub-items (text)
agent-canvas add-text -t "• Increase sales\n• Expand market" -x 50 -y 110 --font-size 12 && \
agent-canvas add-text -t "• Q1: Research\n• Q2: Development" -x 390 -y 110 --font-size 12 && \
agent-canvas add-text -t "• Team: 5 devs\n• Budget: $50k" -x 50 -y 430 --font-size 12 && \
agent-canvas add-text -t "• Tech debt\n• Market change" -x 390 -y 430 --font-size 12 && sleep 0.3 && \

# Connections
agent-canvas add-line -x 250 -y 185 --end-x 130 --end-y 100 && \
agent-canvas add-line -x 400 -y 185 --end-x 420 --end-y 100 && \
agent-canvas add-line -x 250 -y 255 --end-x 130 --end-y 380 && \
agent-canvas add-line -x 400 -y 255 --end-x 420 --end-y 380
```

## Tips

- Central topic should be visually prominent (larger size, bold color)
- Use lines (not arrows) for organic, non-hierarchical feel
- Different colors help distinguish branches instantly
- Add bullet points (`•`) in text for sub-items
- Keep branches balanced around the center
