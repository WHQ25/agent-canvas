# Sequence Diagram

Tutorials for creating sequence diagrams showing interactions between participants over time.

## Planning First (Critical!)

**Before drawing anything, you MUST plan the layout.** Message labels need space between participants. If participants are too close, labels will overlap.

### Step 1: List All Messages

Write out all messages with their labels:
```
User -> Frontend: Click "Login with WeChat"
Frontend -> Backend: GET /auth/wechat
Backend -> WeChat: redirect to authorize
WeChat -> User: Show authorization page
User -> WeChat: Approve
WeChat -> Backend: callback with code
Backend -> WeChat API: POST /oauth/access_token
WeChat API -> Backend: {access_token, openid}
Backend -> Frontend: Set-Cookie: session
Frontend -> User: Login success
```

### Step 2: Find the Longest Label

Identify the longest message label that needs to fit between each pair of participants:
- User ↔ Frontend: "Click Login with WeChat" (~20 chars)
- Frontend ↔ Backend: "GET /auth/wechat" (~16 chars)
- Backend ↔ WeChat: "redirect to authorize" (~20 chars)
- etc.

### Step 3: Calculate Spacing

**Formula for participant spacing:**
```
spacing = max_label_length × 8 + 40

Examples:
- 10 chars: 10 × 8 + 40 = 120px
- 15 chars: 15 × 8 + 40 = 160px
- 20 chars: 20 × 8 + 40 = 200px
- 25 chars: 25 × 8 + 40 = 240px
```

### Step 4: Calculate Participant Positions

```
Given: spacing = 200px, participant_width = 100px

P1 center: 60                    (x = 10)
P2 center: 60 + 200 = 260        (x = 210)
P3 center: 260 + 200 = 460       (x = 410)
P4 center: 460 + 200 = 660       (x = 610)
P5 center: 660 + 200 = 860       (x = 810)

Total width: 860 + 60 = 920px
```

### Step 5: Calculate Vertical Layout

```
Top participants y: 30
Lifeline start: 70 (participant_y + height)
First message y: 100
Message spacing: 40-50px
Number of messages: N
Last message y: 100 + (N-1) × 45
Lifeline end: last_message_y + 30

Bottom participants (optional):
  y = lifeline_end + 10

Total height: bottom_participant_y + 40 + 30 (buffer)
```

## Layout Template

```
┌─────────┐        ┌─────────┐        ┌─────────┐
│   P1    │        │   P2    │        │   P3    │
└────┬────┘        └────┬────┘        └────┬────┘
     │                  │                  │
     │── message 1 ────>│                  │
     │                  │── message 2 ────>│
     │                  │<── message 3 ────│
     │<── message 4 ────│                  │
     │                  │                  │
┌────┴────┐        ┌────┴────┐        ┌────┴────┐
│   P1    │        │   P2    │        │   P3    │  (optional)
└─────────┘        └─────────┘        └─────────┘

Spacing between lifelines must fit the longest label!
```

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| User/Actor | `#b2f2bb` (green) | Human participants |
| Internal Service | `#a5d8ff` (blue) | Your system components |
| External Service | `#b197fc` (purple) | Third-party APIs |
| Sync call arrow | `#1e1e1e` (black) | Request messages |
| Return arrow | `#868e96` (gray) | Response messages |
| Lifeline | `#868e96` dashed | Vertical timeline |

## Drawing Order

1. **Plan** - Calculate all positions first
2. **Top Participants** - Draw all boxes at the top
3. **Lifelines** - Draw vertical dashed lines
4. **Messages** - Draw arrows top to bottom
5. **Labels** - Add text labels on arrows
6. **Bottom Participants** (optional) - Mirror top participants at bottom

## Message Labeling

Labels go above arrows using `bottomCenter` anchor:

```bash
# Arrow from P1 (center=60) to P2 (center=260) at y=100
# Label midpoint: (60+260)/2 = 160, y = 100 - 5 = 95
agent-canvas add-text -t "request()" --ax 160 --ay 95 -a bottomCenter --font-size 14
```

For return messages (right-to-left), use gray color:
```bash
agent-canvas add-text -t "response" --ax 160 --ay 145 -a bottomCenter --font-size 14 \
  --stroke-color "#868e96"
```

## Complete Example: OAuth Login

### Planning Phase

```
Participants (5): User, Frontend, Backend, AuthServer, API
Longest label: "POST /oauth/access_token" = 24 chars
Spacing: 24 × 8 + 40 = 232px → round to 230px
Participant width: 100px

Centers: 60, 290, 520, 750, 980
X positions: 10, 240, 470, 700, 930

Messages (10): y from 100 to 100 + 9×45 = 505
Lifeline end: 505 + 30 = 535
Bottom participants y: 535 + 10 = 545
Total height: 545 + 40 + 30 = 615px
```

### Drawing Code

```bash
# === TOP PARTICIPANTS (y=30, height=40) ===
agent-canvas add-shape -t rectangle -x 10 -y 30 -w 100 -h 40 -l "User" --background-color "#b2f2bb" && \
agent-canvas add-shape -t rectangle -x 240 -y 30 -w 100 -h 40 -l "Frontend" --background-color "#a5d8ff" && \
agent-canvas add-shape -t rectangle -x 470 -y 30 -w 100 -h 40 -l "Backend" --background-color "#a5d8ff" && \
agent-canvas add-shape -t rectangle -x 700 -y 30 -w 100 -h 40 -l "AuthServer" --background-color "#b197fc" && \
agent-canvas add-shape -t rectangle -x 930 -y 30 -w 100 -h 40 -l "API" --background-color "#b197fc" && \

# === LIFELINES (from y=70 to y=535) ===
agent-canvas add-line -x 60 -y 70 --end-x 60 --end-y 535 --stroke-style dashed --stroke-color "#868e96" && \
agent-canvas add-line -x 290 -y 70 --end-x 290 --end-y 535 --stroke-style dashed --stroke-color "#868e96" && \
agent-canvas add-line -x 520 -y 70 --end-x 520 --end-y 535 --stroke-style dashed --stroke-color "#868e96" && \
agent-canvas add-line -x 750 -y 70 --end-x 750 --end-y 535 --stroke-style dashed --stroke-color "#868e96" && \
agent-canvas add-line -x 980 -y 70 --end-x 980 --end-y 535 --stroke-style dashed --stroke-color "#868e96" && \

# === MESSAGES (starting y=100, spacing=45) ===
# 1. User -> Frontend (y=100)
agent-canvas add-arrow -x 60 -y 100 --end-x 290 --end-y 100 && \
agent-canvas add-text -t "Click Login" --ax 175 --ay 95 -a bottomCenter --font-size 14 && \

# 2. Frontend -> Backend (y=145)
agent-canvas add-arrow -x 290 -y 145 --end-x 520 --end-y 145 && \
agent-canvas add-text -t "GET /auth/wechat" --ax 405 --ay 140 -a bottomCenter --font-size 14 && \

# 3. Backend -> AuthServer (y=190)
agent-canvas add-arrow -x 520 -y 190 --end-x 750 --end-y 190 && \
agent-canvas add-text -t "redirect to /authorize" --ax 635 --ay 185 -a bottomCenter --font-size 14 && \

# 4. AuthServer -> User (y=235) - long arrow back
agent-canvas add-arrow -x 750 -y 235 --end-x 60 --end-y 235 && \
agent-canvas add-text -t "Show auth page" --ax 405 --ay 230 -a bottomCenter --font-size 14 && \

# 5. User -> AuthServer (y=280)
agent-canvas add-arrow -x 60 -y 280 --end-x 750 --end-y 280 && \
agent-canvas add-text -t "Approve" --ax 405 --ay 275 -a bottomCenter --font-size 14 && \

# 6. AuthServer -> Backend (y=325) - callback
agent-canvas add-arrow -x 750 -y 325 --end-x 520 --end-y 325 --stroke-color "#868e96" && \
agent-canvas add-text -t "callback?code=xxx" --ax 635 --ay 320 -a bottomCenter --font-size 14 --stroke-color "#868e96" && \

# 7. Backend -> API (y=370)
agent-canvas add-arrow -x 520 -y 370 --end-x 980 --end-y 370 && \
agent-canvas add-text -t "POST /oauth/access_token" --ax 750 --ay 365 -a bottomCenter --font-size 14 && \

# 8. API -> Backend (y=415)
agent-canvas add-arrow -x 980 -y 415 --end-x 520 --end-y 415 --stroke-color "#868e96" && \
agent-canvas add-text -t "{access_token, openid}" --ax 750 --ay 410 -a bottomCenter --font-size 14 --stroke-color "#868e96" && \

# 9. Backend -> Frontend (y=460)
agent-canvas add-arrow -x 520 -y 460 --end-x 290 --end-y 460 --stroke-color "#868e96" && \
agent-canvas add-text -t "Set-Cookie: session" --ax 405 --ay 455 -a bottomCenter --font-size 14 --stroke-color "#868e96" && \

# 10. Frontend -> User (y=505)
agent-canvas add-arrow -x 290 -y 505 --end-x 60 --end-y 505 --stroke-color "#868e96" && \
agent-canvas add-text -t "Login success" --ax 175 --ay 500 -a bottomCenter --font-size 14 --stroke-color "#868e96" && \

# === BOTTOM PARTICIPANTS (y=545, height=40) ===
agent-canvas add-shape -t rectangle -x 10 -y 545 -w 100 -h 40 -l "User" --background-color "#b2f2bb" && \
agent-canvas add-shape -t rectangle -x 240 -y 545 -w 100 -h 40 -l "Frontend" --background-color "#a5d8ff" && \
agent-canvas add-shape -t rectangle -x 470 -y 545 -w 100 -h 40 -l "Backend" --background-color "#a5d8ff" && \
agent-canvas add-shape -t rectangle -x 700 -y 545 -w 100 -h 40 -l "AuthServer" --background-color "#b197fc" && \
agent-canvas add-shape -t rectangle -x 930 -y 545 -w 100 -h 40 -l "API" --background-color "#b197fc"
```

## Tips

- **Plan first**: Always calculate spacing before drawing
- **Longest label rule**: Spacing ≥ longest_label_chars × 8 + 40
- **Consistent spacing**: Use same spacing between all participants
- **Message direction**: Left-to-right = request (black), right-to-left = response (gray)
- **Label position**: Use `bottomCenter` anchor at arrow midpoint, 5px above arrow y
- **Vertical rhythm**: Keep 40-50px between messages for readability
- **Bottom participants**: Mirror top boxes at bottom for standard UML style (y = lifeline_end + 10)
