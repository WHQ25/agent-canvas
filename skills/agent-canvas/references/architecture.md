# Architecture Diagram

Tutorials for creating system architecture and infrastructure diagrams.

## Design Principles

### Component Types
- **Rectangle** - Services, applications, components
- **Ellipse** - Databases, data stores
- **Rectangle (wide)** - Gateways, load balancers

### Color Palette
- Gateway/Entry: `#FFD700` (gold)
- Services: `#87CEEB` (light blue)
- Databases: `#DDA0DD` (light purple)
- Cache/Queue: `#98FB98` (light green)
- External: `#e9ecef` (light gray)

### Standard Sizes
- Services: 120-150x60
- Databases: 100-120x50
- Gateways: 150x60
- Vertical spacing: 120-150px between layers
- Horizontal spacing: 50px between components

## Drawing Order

1. **Top to bottom** - Start with entry points (gateway, load balancer)
2. **Layer by layer** - Draw each architectural layer completely before moving to the next
3. **Arrows last** - Add connections after all components are placed

## Examples

### 3-Tier Architecture

```bash
agent-canvas add-text -t "Presentation Layer" -x 200 -y 20 --font-size 14 -n "Layer label" && \
agent-canvas add-shape -t rectangle -x 200 -y 50 -w 200 -h 60 -l "Web App\n(React)" --background-color "#87CEEB" -n "Frontend SPA" && sleep 0.3 && \
agent-canvas add-text -t "Application Layer" -x 200 -y 150 --font-size 14 -n "Layer label" && \
agent-canvas add-shape -t rectangle -x 200 -y 180 -w 200 -h 60 -l "API Server\n(Node.js)" --background-color "#98FB98" -n "Backend REST API" && sleep 0.3 && \
agent-canvas add-text -t "Data Layer" -x 200 -y 280 --font-size 14 -n "Layer label" && \
agent-canvas add-shape -t ellipse -x 200 -y 310 -w 200 -h 60 -l "PostgreSQL" --background-color "#DDA0DD" -n "Primary database" && sleep 0.3 && \
agent-canvas add-arrow -x 300 -y 110 --end-x 300 --end-y 180 -n "HTTP requests" && \
agent-canvas add-arrow -x 300 -y 240 --end-x 300 --end-y 310 -n "SQL queries"
```

### Microservices Architecture

```bash
agent-canvas add-shape -t rectangle -x 220 -y 30 -w 160 -h 50 -l "API Gateway" --background-color "#FFD700" -n "Entry point, routing, auth" && sleep 0.3 && \
agent-canvas add-shape -t rectangle -x 50 -y 150 -w 120 -h 50 -l "User Service" --background-color "#87CEEB" -n "User auth and profiles" && \
agent-canvas add-shape -t rectangle -x 200 -y 150 -w 120 -h 50 -l "Order Service" --background-color "#87CEEB" -n "Order processing" && \
agent-canvas add-shape -t rectangle -x 350 -y 150 -w 120 -h 50 -l "Product Service" --background-color "#87CEEB" -n "Product catalog" && sleep 0.3 && \
agent-canvas add-shape -t ellipse -x 50 -y 270 -w 100 -h 40 -l "Users DB" --background-color "#DDA0DD" -n "User data store" && \
agent-canvas add-shape -t ellipse -x 210 -y 270 -w 100 -h 40 -l "Orders DB" --background-color "#DDA0DD" -n "Order data store" && \
agent-canvas add-shape -t ellipse -x 360 -y 270 -w 100 -h 40 -l "Products DB" --background-color "#DDA0DD" -n "Product data store" && sleep 0.3 && \
agent-canvas add-arrow -x 260 -y 80 --end-x 110 --end-y 150 -n "Route to User Service" && \
agent-canvas add-arrow -x 300 -y 80 --end-x 260 --end-y 150 -n "Route to Order Service" && \
agent-canvas add-arrow -x 340 -y 80 --end-x 410 --end-y 150 -n "Route to Product Service" && \
agent-canvas add-arrow -x 110 -y 200 --end-x 100 --end-y 270 -n "User DB connection" && \
agent-canvas add-arrow -x 260 -y 200 --end-x 260 --end-y 270 -n "Order DB connection" && \
agent-canvas add-arrow -x 410 -y 200 --end-x 410 --end-y 270 -n "Product DB connection"
```

## Tips

- Use color to distinguish component types at a glance
- Add layer labels for clarity
- Use `\n` in labels for multi-line text (e.g., "Service Name\n(Technology)")
- Keep consistent sizes within the same layer
