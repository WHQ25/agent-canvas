# Flowchart Examples

## Basic Flowchart

```bash
# Vertical flowchart with decision
agent-canvas add-shape -t rectangle -x 200 -y 50 -w 120 -h 50 -l "Start" --background-color "#90EE90" && \
agent-canvas add-shape -t rectangle -x 200 -y 150 -w 120 -h 50 -l "Process A" && \
agent-canvas add-shape -t diamond -x 200 -y 270 -w 120 -h 80 -l "Condition?" && \
agent-canvas add-shape -t rectangle -x 50 -y 400 -w 120 -h 50 -l "Path A" && \
agent-canvas add-shape -t rectangle -x 350 -y 400 -w 120 -h 50 -l "Path B" && \
agent-canvas add-shape -t rectangle -x 200 -y 500 -w 120 -h 50 -l "End" --background-color "#FFB6C1" && sleep 0.3 && \
agent-canvas add-arrow -x 260 -y 100 --end-x 260 --end-y 150 && \
agent-canvas add-arrow -x 260 -y 200 --end-x 260 --end-y 270 && \
agent-canvas add-arrow -x 200 -y 310 --end-x 110 --end-y 400 && \
agent-canvas add-arrow -x 320 -y 310 --end-x 410 --end-y 400 && \
agent-canvas add-arrow -x 110 -y 450 --end-x 200 --end-y 500 && \
agent-canvas add-arrow -x 410 -y 450 --end-x 320 --end-y 500
```

## Horizontal Process Flow

```bash
agent-canvas add-shape -t rectangle -x 50 -y 100 -w 100 -h 60 -l "Input" && \
agent-canvas add-shape -t rectangle -x 200 -y 100 -w 100 -h 60 -l "Process" && \
agent-canvas add-shape -t rectangle -x 350 -y 100 -w 100 -h 60 -l "Output" && sleep 0.2 && \
agent-canvas add-arrow -x 150 -y 130 --end-x 200 --end-y 130 && \
agent-canvas add-arrow -x 300 -y 130 --end-x 350 --end-y 130
```

## Tips

- Use `--background-color "#90EE90"` (green) for start nodes
- Use `--background-color "#FFB6C1"` (pink) for end nodes
- Use diamond shape for decision points
- Standard spacing: 100-150px between nodes vertically
