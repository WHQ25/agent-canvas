# Architecture Diagram Examples

## Simple 3-Tier Architecture

```bash
# Frontend
agent-canvas add-shape -t rectangle -x 200 -y 50 -w 200 -h 80 -l "Frontend\n(React)" --background-color "#87CEEB" && \
# Backend
agent-canvas add-shape -t rectangle -x 200 -y 200 -w 200 -h 80 -l "Backend\n(Node.js)" --background-color "#98FB98" && \
# Database
agent-canvas add-shape -t ellipse -x 200 -y 350 -w 200 -h 80 -l "Database\n(PostgreSQL)" --background-color "#DDA0DD" && sleep 0.3 && \
# Arrows
agent-canvas add-arrow -x 300 -y 130 --end-x 300 --end-y 200 && \
agent-canvas add-arrow -x 300 -y 280 --end-x 300 --end-y 350
```

## Microservices Architecture

```bash
# API Gateway
agent-canvas add-shape -t rectangle -x 250 -y 50 -w 150 -h 60 -l "API Gateway" --background-color "#FFD700" && \
# Services
agent-canvas add-shape -t rectangle -x 50 -y 180 -w 120 -h 60 -l "User Service" --background-color "#87CEEB" && \
agent-canvas add-shape -t rectangle -x 220 -y 180 -w 120 -h 60 -l "Order Service" --background-color "#87CEEB" && \
agent-canvas add-shape -t rectangle -x 390 -y 180 -w 120 -h 60 -l "Product Service" --background-color "#87CEEB" && \
# Databases
agent-canvas add-shape -t ellipse -x 50 -y 300 -w 100 -h 50 -l "Users DB" --background-color "#DDA0DD" && \
agent-canvas add-shape -t ellipse -x 220 -y 300 -w 100 -h 50 -l "Orders DB" --background-color "#DDA0DD" && \
agent-canvas add-shape -t ellipse -x 390 -y 300 -w 100 -h 50 -l "Products DB" --background-color "#DDA0DD" && sleep 0.3 && \
# Connections
agent-canvas add-arrow -x 280 -y 110 --end-x 110 --end-y 180 && \
agent-canvas add-arrow -x 325 -y 110 --end-x 280 --end-y 180 && \
agent-canvas add-arrow -x 370 -y 110 --end-x 450 --end-y 180 && \
agent-canvas add-arrow -x 110 -y 240 --end-x 100 --end-y 300 && \
agent-canvas add-arrow -x 280 -y 240 --end-x 270 --end-y 300 && \
agent-canvas add-arrow -x 450 -y 240 --end-x 440 --end-y 300
```

## Tips

- Use color coding: blue for services, purple for databases, yellow for gateways
- Use ellipse for databases to distinguish from services
- Add `\n` in labels for multi-line text
