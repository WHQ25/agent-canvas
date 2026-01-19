# UI Mockup & Wireframe

Tutorials for creating UI wireframes and mockups.

## Design Principles

### Clarity First
- Use simple shapes (rectangles, ellipses) to represent UI components
- Add text labels to clarify the purpose of each element
- Maintain consistent spacing and alignment

### Color Palette
Use colors to differentiate element types:
- Containers/Frames: `#e9ecef` (light gray)
- Buttons/Actions: `#ffc9c9` (light red/pink)
- Input fields: `#a5d8ff` (light blue)
- Success/Confirm: `#b2f2bb` (light green)
- Warning/Alert: `#ffec99` (light yellow)

### Standard Sizes
- Screen frame: 375x812 (mobile), 1440x900 (desktop)
- Buttons: 120x40
- Input fields: 250x40
- Cards: 300x200
- Padding: 16-24px from edges

### Text Sizes
- Headings: 24-32px
- Labels/body: 16-20px
- Captions/hints: 12-14px

## Drawing Order

1. **Frame first** - Draw the main container/screen boundary
2. **Title** - Add a title above the frame (e.g., "Login Page (375x812)")
3. **Major sections** - Add header, content area, footer
4. **Components** - Add buttons, inputs, cards inside sections
5. **Labels** - Add text labels to explain each component

## Examples

### Mobile Login Screen

```bash
# Frame + Title
agent-canvas add-shape -t rectangle -x 100 -y 100 -w 375 -h 812 --background-color "#e9ecef" && \
agent-canvas add-text -t "Login Page (375x812)" -x 100 -y 60 --font-size 16 && sleep 0.3 && \

# Header
agent-canvas add-shape -t rectangle -x 116 -y 116 -w 343 -h 60 --background-color "#ffffff" -l "Header" && \

# Logo placeholder
agent-canvas add-shape -t ellipse -x 220 -y 200 -w 80 -h 80 --background-color "#a5d8ff" -l "Logo" && sleep 0.3 && \

# Input fields
agent-canvas add-shape -t rectangle -x 140 -y 320 -w 250 -h 44 --background-color "#ffffff" -l "Email" && \
agent-canvas add-shape -t rectangle -x 140 -y 380 -w 250 -h 44 --background-color "#ffffff" -l "Password" && sleep 0.3 && \

# Login button
agent-canvas add-shape -t rectangle -x 140 -y 460 -w 250 -h 44 --background-color "#ffc9c9" -l "Login" && \

# Forgot password link
agent-canvas add-text -t "Forgot password?" -x 200 -y 520 --font-size 14
```

### Desktop Dashboard Layout

```bash
# Frame + Title
agent-canvas add-shape -t rectangle -x 50 -y 100 -w 1200 -h 700 --background-color "#e9ecef" && \
agent-canvas add-text -t "Dashboard (1200x700)" -x 50 -y 60 --font-size 16 && sleep 0.3 && \

# Sidebar
agent-canvas add-shape -t rectangle -x 66 -y 116 -w 200 -h 668 --background-color "#ffffff" -l "Sidebar" && \

# Header
agent-canvas add-shape -t rectangle -x 282 -y 116 -w 952 -h 60 --background-color "#ffffff" -l "Header" && sleep 0.3 && \

# Content cards
agent-canvas add-shape -t rectangle -x 300 -y 200 -w 280 -h 180 --background-color "#ffffff" -l "Card 1" && \
agent-canvas add-shape -t rectangle -x 600 -y 200 -w 280 -h 180 --background-color "#ffffff" -l "Card 2" && \
agent-canvas add-shape -t rectangle -x 900 -y 200 -w 280 -h 180 --background-color "#ffffff" -l "Card 3" && sleep 0.3 && \

# Main content area
agent-canvas add-shape -t rectangle -x 300 -y 400 -w 880 -h 280 --background-color "#ffffff" -l "Main Content"
```

### Form Component

```bash
# Form container
agent-canvas add-shape -t rectangle -x 100 -y 100 -w 400 -h 350 --background-color "#e9ecef" && \
agent-canvas add-text -t "Contact Form" -x 100 -y 60 --font-size 20 && sleep 0.3 && \

# Form fields
agent-canvas add-text -t "Name" -x 130 -y 130 --font-size 14 && \
agent-canvas add-shape -t rectangle -x 130 -y 150 -w 340 -h 40 --background-color "#ffffff" && \

agent-canvas add-text -t "Email" -x 130 -y 210 --font-size 14 && \
agent-canvas add-shape -t rectangle -x 130 -y 230 -w 340 -h 40 --background-color "#ffffff" && \

agent-canvas add-text -t "Message" -x 130 -y 290 --font-size 14 && \
agent-canvas add-shape -t rectangle -x 130 -y 310 -w 340 -h 80 --background-color "#ffffff" && sleep 0.3 && \

# Submit button
agent-canvas add-shape -t rectangle -x 330 -y 410 -w 140 -h 40 --background-color "#b2f2bb" -l "Submit"
```

## Tips

- **Container padding**: Keep 16-24px padding between container edges and child elements
- **Consistent spacing**: Use same spacing (e.g., 20px) between similar elements
- **Visual hierarchy**: Larger/bolder elements for important actions
- **Alignment**: Align elements to a grid for clean layouts
