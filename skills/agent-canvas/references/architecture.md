# Architecture Diagram

A guide for creating clear, professional architecture diagrams with a hand-drawn aesthetic.

## Philosophy

Architecture diagrams are **communication tools**, not technical specifications. A good diagram tells a story at a glance:
- What are the major components?
- How do they relate to each other?
- What is the flow of data or control?

**Less is more.** Every element should earn its place. If removing something doesn't reduce understanding, remove it.

## Visual Language

### Shapes and Their Meanings
- **Rectangle** — Services, applications, APIs, logical components
- **Rounded rectangle** — External systems, user-facing components
- **Ellipse/Cylinder** — Data stores (databases, caches, queues)
- **Wide rectangle** — Entry points (gateways, load balancers) - often spans multiple columns

### Color Semantics
Use color to create instant visual grouping. Stick to 3-4 colors max:

| Role | Color | Hex |
|------|-------|-----|
| Entry/Gateway | Gold | `#FFD700` |
| Services | Light Blue | `#87CEEB` |
| Data Stores | Light Purple | `#DDA0DD` |
| Infrastructure | Light Green | `#98FB98` |
| External | Light Gray | `#e9ecef` |

**Rule**: Same color = same type. If two things look the same, they should BE the same type.

## Layout Principles

### Think in Layers
Arrange components in horizontal layers, with data flowing top-to-bottom:

```
Layer 1: Entry points (what users/clients hit first)
Layer 2: Routing/API layer (optional)
Layer 3: Services/Business logic
Layer 4: Data layer (databases, caches)
```
Wrap each layer with dashed rect, all layer rect should have same width and put a layer name text to the right of of the layer rect.

### Alignment is Everything
- Components in the same layer should share the same Y coordinate (align by vertical center)
- Related components (service + its database) should share the same X coordinate (align by horizontal center)

### Layer Layout (like CSS flexbox)
Within each layer, elements should **fill the available width evenly**:

```
Given: layer width = W, element count = n, gap = g (e.g., 20px), padding = p (e.g., 15px)
Inner width = W - 2 × p
Element width = (inner_width - (n-1) × g) / n
```

**Example**: 4 services in a 800px layer, gap=20px, padding=15px:
- Inner width = 800 - 2×15 = 770px
- Element width = (770 - 3×20) / 4 = 177px

**Single element (n = 1)**: Element spans full layer width (width = W), no boundary box needed.

**Multiple elements (n > 1)**: Wrap them with a dashed rect boundary box:
- Box width = W (full layer width)
- Box height = element_height + 2 × padding
- Elements start at x = layer_x + padding

This ensures:
- All elements in a layer have **identical width**
- **Equal spacing** between elements
- Elements **fill the entire layer width**
- Clear visual grouping with boundary box

## The Position-First Principle

**The most important rule: Position communicates relationship. Arrows are optional annotations.**

### What Position Already Tells Us

| Layout Pattern | Implied Relationship | Arrow Needed? |
|----------------|---------------------|---------------|
| Vertical stacking (A above B) | A calls/uses B | ❌ NO |
| Horizontal alignment | Same layer, same role | ❌ NO |
| Vertical alignment (Service above DB) | Service owns that DB | ❌ NO |
| Component inside a boundary box | Belongs to that group | ❌ NO |

**Default behavior: DO NOT draw arrows.** The layout itself is the diagram.

### When Arrows Add Value

Only add arrows when the relationship is **NOT implied by position**:

- **Horizontal flow**: Service A calls Service B (same layer, not obvious)
- **Skip-layer connection**: Component connects to something not directly below
- **Async/Event flow**: Message queue patterns, callbacks
- **Cross-cutting concerns**: Logging, monitoring that spans multiple components

### Decision Framework

Before drawing ANY arrow, ask yourself:
1. Is this relationship already clear from vertical position? → **Skip arrow**
2. Is this relationship already clear from horizontal grouping? → **Skip arrow**
3. Would a reader be CONFUSED without this arrow? → **Add arrow**
4. Is this a non-obvious cross-cutting concern? → **Add arrow**

**Rule of thumb**: Arrows ≤ 50% of component count. A 10-component diagram should have at most 5 arrows.

### Anti-Pattern: Arrow Explosion

❌ **BAD** — Connecting everything with arrows:
```
[Gateway]──►[Svc A]──►[DB A]
    │           │
    └──►[Svc B]──►[DB B]
    │           │
    └──►[Svc C]──►[Cache]
```
This is visual noise. The arrows add no information that position doesn't already convey.

✅ **GOOD** — Let position do the work:
```
        [Gateway]

  [Svc A]  [Svc B]  [Svc C]

  [DB A]   [DB B]   [Cache]
```
Same information, zero arrows. The hierarchy is obvious from the layout.

### Arrow Rules (when you must use them)

- Straight vertical or horizontal lines only
- NEVER cross other arrows
- NEVER overlap with components
- If arrows would cross, redesign the layout instead

## Advanced Layout Techniques

### Boundary Boxes (Grouping)
Use **background rectangles** to group related components instead of connecting them with arrows:

- Draw a large rectangle with a light background color
- Place related components inside
- Add a label at the top-left or top-center of the box
- This visually communicates "these things belong together" without any arrows

**Example uses:**
- "Data Layer" box containing multiple databases
- "Service Mesh" box containing microservices
- "External Systems" box for third-party integrations

### Sidebar Components (Cross-cutting Concerns)
For components that span multiple layers (security, monitoring, operations):

- Place them as **vertical bars on the left or right side**
- Use a distinct color (e.g., blue) to differentiate from main flow
- Label them vertically or at top/bottom

**Example:** Security, Logging, DevOps tools that touch all layers

### Region Labels
Add **text labels on the right side** to name major regions:

- "Application Layer"
- "Service Layer"
- "Data Layer"
- "Infrastructure"

This helps readers quickly understand the architecture's structure.

### Layer Background Colors
Use subtle background colors for entire horizontal layers:

- Each layer gets a different tint
- Components sit on top of the colored background
- Creates clear visual separation without arrows

## Drawing Process

1. **Sketch the layers first** — Identify what belongs in each horizontal layer
2. **Add boundary boxes** — Group related components with background rectangles
3. **Place components** — Start from bottom, work up. Align carefully.
4. **Add sidebar components** — Cross-cutting concerns on left/right
5. **Add region labels** — Text labels on the right side
6. **Add arrows last** — Only where position doesn't convey the relationship
7. **Review and simplify** — Remove anything that doesn't add understanding

## Sizing Guidelines

Keep components in the same layer the same size for visual harmony:

| Component Type | Recommended Size |
|----------------|------------------|
| Gateway/Entry | 180-250 × 50 |
| Service | 120-150 × 50-60 |
| Database | 120-150 × 50-60 |
| Small label box | 80-100 × 40 |

**Tip**: Calculate label width first (CJK: chars × 16, English: chars × 10), then add 30-40px padding.

## Common Patterns

### Microservices
```
[API Gateway] ← wide, centered at top
     ↓
[Svc A] [Svc B] [Svc C] ← evenly spaced row
   ↓       ↓       ↓
[DB A]  [DB B]  [DB C] ← aligned below their service
```

### Shared Database
```
[Service A] [Service B] [Service C]
      ↓          ↓          ↓
   ┌─────────────────────────────┐
   │      Shared Database        │  ← spans full width
   └─────────────────────────────┘
```

### Event-Driven
```
[Producer A] [Producer B]
      ↓           ↓
   ┌─────────────────────────────┐
   │       Message Queue         │
   └─────────────────────────────┘
      ↓           ↓
[Consumer X] [Consumer Y]
```

## Final Checklist

Before exporting, verify:
- [ ] Can someone understand this in 5 seconds?
- [ ] Are same-type components the same size and color?
- [ ] Are layers horizontally aligned?
- [ ] Do arrows flow cleanly without crossing?
- [ ] Is there anything I can remove without losing meaning?

**Remember**: The best architecture diagram is the simplest one that still communicates the full picture.
