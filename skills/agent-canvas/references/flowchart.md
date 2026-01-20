# Flowchart

Tutorials for creating flowcharts, process flows, and decision trees.

## Design Principles

### Node Types
- **Ellipse** - Start/End nodes
- **Rectangle** - Process steps
- **Diamond** - Decision points (Yes/No questions)

### Color Palette
- Start: `#90EE90` (light green)
- End: `#FFB6C1` (light pink)
- Process: `#a5d8ff` (light blue)
- Decision: `#ffec99` (light yellow)

### Standard Sizes
- Process nodes: 120x50
- Decision diamonds: 120x80
- Vertical spacing: 100px between nodes
- Horizontal spacing: 150px for branches

## Drawing Order

1. **Nodes first** - Draw all shapes from top to bottom
2. **Arrows second** - Connect nodes after all shapes are placed
3. **Arrow positioning** - Connect to shape edges, not centers:
   - Bottom of shape: `y = node.y + node.height`
   - Top of shape: `y = node.y`
   - Center X: `x = node.x + node.width/2`

## Examples

### Linear Process Flow

```bash
agent-canvas add-shape -t ellipse -x 200 -y 50 -w 120 -h 50 -l "Start" --background-color "#90EE90" -n "Flow entry point" && \
agent-canvas add-shape -t rectangle -x 200 -y 150 -w 120 -h 50 -l "Step 1" --background-color "#a5d8ff" -n "First processing step" && \
agent-canvas add-shape -t rectangle -x 200 -y 250 -w 120 -h 50 -l "Step 2" --background-color "#a5d8ff" -n "Second processing step" && \
agent-canvas add-shape -t ellipse -x 200 -y 350 -w 120 -h 50 -l "End" --background-color "#FFB6C1" -n "Flow exit point" && sleep 0.3 && \
agent-canvas add-arrow -x 260 -y 100 --end-x 260 --end-y 150 -n "Start to Step 1" && \
agent-canvas add-arrow -x 260 -y 200 --end-x 260 --end-y 250 -n "Step 1 to Step 2" && \
agent-canvas add-arrow -x 260 -y 300 --end-x 260 --end-y 350 -n "Step 2 to End"
```

### Decision Flowchart

```bash
agent-canvas add-shape -t ellipse -x 200 -y 50 -w 120 -h 50 -l "Start" --background-color "#90EE90" -n "Flow entry" && \
agent-canvas add-shape -t rectangle -x 200 -y 150 -w 120 -h 50 -l "Process" --background-color "#a5d8ff" -n "Main processing step" && \
agent-canvas add-shape -t diamond -x 200 -y 270 -w 120 -h 80 -l "Valid?" --background-color "#ffec99" -n "Validation check" && \
agent-canvas add-shape -t rectangle -x 50 -y 400 -w 100 -h 50 -l "Yes Path" --background-color "#b2f2bb" -n "Success handler" && \
agent-canvas add-shape -t rectangle -x 350 -y 400 -w 100 -h 50 -l "No Path" --background-color "#ffc9c9" -n "Error handler" && \
agent-canvas add-shape -t ellipse -x 200 -y 500 -w 120 -h 50 -l "End" --background-color "#FFB6C1" -n "Flow exit" && sleep 0.3 && \
agent-canvas add-arrow -x 260 -y 100 --end-x 260 --end-y 150 -n "Start to Process" && \
agent-canvas add-arrow -x 260 -y 200 --end-x 260 --end-y 270 -n "Process to Decision" && \
agent-canvas add-arrow -x 200 -y 310 --end-x 100 --end-y 400 -n "Yes branch" && \
agent-canvas add-arrow -x 320 -y 310 --end-x 400 --end-y 400 -n "No branch" && \
agent-canvas add-arrow -x 100 -y 450 --end-x 200 --end-y 500 -n "Yes to End" && \
agent-canvas add-arrow -x 400 -y 450 --end-x 320 --end-y 500 -n "No to End"
```

## Tips

- Draw shapes first, arrows second
- Keep flows vertical when possible (top to bottom)
- Label decision branches (Yes/No) using text if needed
- Use consistent spacing for visual balance
