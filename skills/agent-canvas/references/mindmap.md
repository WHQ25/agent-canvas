# Mind Map Examples

## Basic Mind Map

```bash
# Central topic
agent-canvas add-shape -t ellipse -x 300 -y 250 -w 150 -h 80 -l "Main Topic" --background-color "#FFD700" && \
# Branches
agent-canvas add-shape -t ellipse -x 100 -y 100 -w 120 -h 50 -l "Branch 1" --background-color "#87CEEB" && \
agent-canvas add-shape -t ellipse -x 500 -y 100 -w 120 -h 50 -l "Branch 2" --background-color "#98FB98" && \
agent-canvas add-shape -t ellipse -x 100 -y 400 -w 120 -h 50 -l "Branch 3" --background-color "#DDA0DD" && \
agent-canvas add-shape -t ellipse -x 500 -y 400 -w 120 -h 50 -l "Branch 4" --background-color "#FFB6C1" && sleep 0.3 && \
# Lines connecting to center
agent-canvas add-line -x 300 -y 250 --end-x 160 --end-y 125 && \
agent-canvas add-line -x 375 -y 250 --end-x 500 --end-y 125 && \
agent-canvas add-line -x 300 -y 290 --end-x 160 --end-y 400 && \
agent-canvas add-line -x 375 -y 290 --end-x 500 --end-y 400
```

## Project Planning Mind Map

```bash
# Center
agent-canvas add-shape -t ellipse -x 300 -y 250 -w 140 -h 70 -l "Project X" --background-color "#FFD700" && \
# Main branches
agent-canvas add-shape -t rectangle -x 80 -y 80 -w 100 -h 40 -l "Goals" --background-color "#87CEEB" && \
agent-canvas add-shape -t rectangle -x 450 -y 80 -w 100 -h 40 -l "Timeline" --background-color "#98FB98" && \
agent-canvas add-shape -t rectangle -x 80 -y 420 -w 100 -h 40 -l "Resources" --background-color "#DDA0DD" && \
agent-canvas add-shape -t rectangle -x 450 -y 420 -w 100 -h 40 -l "Risks" --background-color "#FFB6C1" && sleep 0.2 && \
# Sub-items
agent-canvas add-text -t "• Goal 1\n• Goal 2" -x 50 -y 140 --font-size 14 && \
agent-canvas add-text -t "• Q1: Design\n• Q2: Build" -x 420 -y 140 --font-size 14 && sleep 0.2 && \
# Connections
agent-canvas add-line -x 300 -y 215 --end-x 130 --end-y 120 && \
agent-canvas add-line -x 370 -y 215 --end-x 450 --end-y 120 && \
agent-canvas add-line -x 300 -y 285 --end-x 130 --end-y 420 && \
agent-canvas add-line -x 370 -y 285 --end-x 450 --end-y 420
```

## Tips

- Use ellipse for central topic (larger, prominent color)
- Use different colors for each branch to improve readability
- Use lines (not arrows) for mind map connections
- Add text elements for sub-items
