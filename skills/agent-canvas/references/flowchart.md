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

### Alignment (Center-aligned)
All nodes in the main flow should be **center-aligned** on the same X axis:
```
centerX = 200  (pick a consistent center line)

Node positions:
  x = centerX - width/2

Example (all nodes 120px wide):
  x = 200 - 60 = 140  (for all main flow nodes)
```

Branch nodes should be **symmetrically placed** on both sides:
```
Left branch:   x = centerX - spacing - width/2
Right branch:  x = centerX + spacing - width/2

Example (spacing=100, width=120):
  Left:  x = 200 - 100 - 60 = 40
  Right: x = 200 + 100 - 60 = 140
```

## Drawing Order

1. **Nodes first** - Draw all shapes from top to bottom
2. **Arrows second** - Connect nodes after all shapes are placed
3. **Arrow positioning** - Arrows MUST connect at the **midpoint** of node edges:
   ```
   Node at (x, y) with size (w, h):

   Top edge midpoint:    (x + w/2, y)
   Bottom edge midpoint: (x + w/2, y + h)
   Left edge midpoint:   (x, y + h/2)
   Right edge midpoint:  (x + w, y + h/2)
   ```

   **Never** connect arrows to corners or arbitrary points on edges.

## Arrow Types for Flowcharts

### Elbow Arrow Direction Rules
Elbow arrows (`--arrow-type elbow`) follow a consistent path pattern based on exit direction:

| Exit from | Path order | Example |
|-----------|------------|---------|
| **Side edge** (left/right) | Horizontal first → then vertical | `→ ↓` or `← ↓` |
| **Top/Bottom edge** | Vertical first → then horizontal | `↓ →` or `↑ ←` |

### Decision Branches (MUST use elbow from side edges)
Decision points (diamonds) should **always use `--arrow-type elbow`** for branches:
- Exit from **left/right edges** of the diamond (NOT bottom)
- Path goes **horizontal first**, then turns vertical down to target

**Coordinate calculation for diamond side edges:**
```
Diamond at (x=140, y=250, w=120, h=80):
  centerY = y + h/2 = 250 + 40 = 290
  leftEdge_x = x = 140
  rightEdge_x = x + w = 260

Left branch arrow:  start at (140, 290) → end at (target_cx, target_y)
Right branch arrow: start at (260, 290) → end at (target_cx, target_y)
```

**Example code for decision branches:**
```bash
# Diamond at x=140, y=250, w=120, h=80
# Left target at x=40, y=400, w=120 (cx=100)
# Right target at x=240, y=400, w=120 (cx=300)

# Left branch (Yes): exit from left edge (140, 290)
agent-canvas add-arrow -x 140 -y 290 --end-x 100 --end-y 400 \
  --arrow-type elbow -n "Yes branch"

# Right branch (No): exit from right edge (260, 290)
agent-canvas add-arrow -x 260 -y 290 --end-x 300 --end-y 400 \
  --arrow-type elbow -n "No branch"
```

### Loop/Retry Arrows (elbow, side-to-side)
For loops going back to a previous step:
- **Start**: from the side edge (left or right) of the source node
- **End**: to the side edge of the target node (same side)
- **Path**: horizontal first (outward) → vertical (up/down) → horizontal (inward)

```
          ┌───────────┐
   ┌─────→│   Input   │
   │      └─────┬─────┘
   │            ↓
   │      ◇ Decision ◇
   │            │ No
   │      ┌─────↓─────┐
   └──────┤   Error   │
          └───────────┘

   Loop path (from Error right edge):
   → (horizontal out) → ↑ (vertical up) → ← (horizontal in to Input)
```

**Pattern:**
```bash
# loop_x = rightmost_element_x + 50 (clearance outside the flow)
agent-canvas add-arrow \
  -x <error_right_edge> -y <error_cy> \
  --end-x <input_right_edge> --end-y <input_cy> \
  --arrow-type elbow \
  --via "<loop_x>,<error_cy>;<loop_x>,<input_cy>"
```

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
agent-canvas add-arrow -x 200 -y 310 --end-x 100 --end-y 400 --arrow-type elbow --via "200,380;100,380" -n "Yes branch" && \
agent-canvas add-arrow -x 320 -y 310 --end-x 400 --end-y 400 --arrow-type elbow --via "320,380;400,380" -n "No branch" && \
agent-canvas add-arrow -x 100 -y 450 --end-x 200 --end-y 500 --arrow-type elbow --via "100,480;200,480" -n "Yes to End" && \
agent-canvas add-arrow -x 400 -y 450 --end-x 320 --end-y 500 --arrow-type elbow --via "400,480;320,480" -n "No to End"
```

## Tips

- Draw shapes first, arrows second
- Keep flows vertical when possible (top to bottom)
- Label decision branches (Yes/No) using text if needed
- Use consistent spacing for visual balance
