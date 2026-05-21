# 7v7 Tactics Board — Design

**Date:** 2026-05-21
**Project:** Pivo (Russian-speaking amateur 7v7 team)
**Formation:** 2-3-1
**Roster:**
- 1 — Егор (GK)
- 2 — Леша (DEF), 3 — Дима (DEF)
- 6 — Максим (MID/L), 5 — Ашот (MID/C), 4 — Мася (MID/R)
- 7 — Сережа (FWD)

## Goal

Build a shareable, mobile-first web page where teammates can watch short animated scenarios that show where each player should be — and how they should move — in common attack and defense situations. Used both as a teaching tool (team chat link) and as a playful tactical demo.

## Audience and use case

- **Primary**: teammates open a URL on their phone, browse 8 scenarios, watch animations, tap players to learn their role.
- **Secondary**: author (Max) uses it as a tactical sketchpad and pre-match reference.
- **Not in scope**: live match annotation, opponent scouting, video sync, multi-team support.

## Interaction model

Storybook with peeking:
- Author pre-builds scenarios; viewer cannot edit.
- Each scenario is a 4–6 second animation with a play/pause control and a scrubber.
- Viewer can tap any player to see their role in this scenario.
- Layer toggles (off by default) reveal extra overlays: press triggers, passing lanes, marking.
- Players in the active keyframe get highlighted (yellow pulsing ring) to draw the eye.
- Dashed trails show where each player moved from; fade as time progresses.

## Visual style

- Top-down 2D pitch (industry standard for tactics boards — clearer than 3D for movement).
- Pitch is vertical (long axis up-down) to fill a phone screen in portrait.
- Our goal at the top; we attack downward. Consistent across all scenarios so viewers never get disoriented.
- Players as dark circles with shirt number in orange (GK = green circle with black number); name label below.
- Ball is a white circle outlined in black.
- Background green, white field markings.
- UI is in Russian. Player names always Russian.

## Architecture

Static single-page app. No build tool, no backend.

```
football7/
├── index.html
├── styles.css                 # mobile-first, ~150 lines
├── app.js                     # bootstrap, controls, state
├── pitch.js                   # SVG rendering of pitch + players + overlays
├── animator.js                # keyframe interpolation
├── scenarios/
│   ├── index.json             # manifest of all scenarios
│   ├── shape-low-block.json
│   ├── shape-ball-on-flank.json
│   ├── build-gk-short.json
│   ├── build-break-press.json
│   ├── press-high-trigger.json
│   ├── press-mid-block.json
│   ├── attack-overlap-right.json
│   └── attack-switch-play.json
└── assets/
    └── ball.svg
```

Hosted on GitHub Pages — one URL to share in the team chat.

### Tech stack

- Vanilla JavaScript (ES modules). No framework.
- SVG for the pitch and all visual elements.
- Plain CSS, no preprocessor.
- No build step, no bundler, no package.json required (could add one later for deployment helpers).
- Total payload target: under 50 KB gzipped.

### Why no framework

The viewer is read-only and has maybe 30 elements on screen. Framework overhead (React/Vue/Svelte runtime + build pipeline) is unjustified. SVG animates well with simple `requestAnimationFrame` interpolation. Future growth (more formations, opponent overlay) can swap in a framework without changing the JSON data model.

## Data model

Each scenario is a JSON file. Manifest `scenarios/index.json` lists them with category and order.

### Scenario schema

```json
{
  "id": "press-high-trigger",
  "category": "press",
  "title": "Высокий прессинг по триггеру",
  "subtitle": "Когда вратарь соперника получает мяч",
  "duration_ms": 4500,
  "ball_side": "opponent",
  "initial": {
    "ball": { "x": 50, "y": 88 },
    "players": {
      "1": { "x": 50, "y": 8 },
      "2": { "x": 30, "y": 30 },
      "3": { "x": 70, "y": 30 },
      "6": { "x": 22, "y": 50 },
      "5": { "x": 50, "y": 50 },
      "4": { "x": 78, "y": 50 },
      "7": { "x": 50, "y": 75 }
    }
  },
  "keyframes": [
    {
      "t": 0,
      "note": "Старт: мяч у их вратаря"
    },
    {
      "t": 0.4,
      "note": "Сережа давит вратаря. Ашот закрывает их опорника",
      "players": {
        "7": { "x": 50, "y": 85, "highlight": true },
        "5": { "x": 50, "y": 62, "highlight": true }
      }
    },
    {
      "t": 0.75,
      "note": "Защитники поджимают, фланги закрывают их крайних",
      "players": {
        "2": { "x": 32, "y": 45 },
        "3": { "x": 68, "y": 45 },
        "6": { "x": 22, "y": 60 },
        "4": { "x": 78, "y": 60 }
      }
    },
    {
      "t": 1,
      "note": "Вратарь под давлением — пас на фланг, перехват",
      "ball": { "x": 30, "y": 65 }
    }
  ],
  "layers": {
    "press_triggers": [
      { "from": 7, "to_ball": true, "label": "Триггер: пас на вратаря" }
    ],
    "covering": [
      { "from": 5, "covers": "опорник" }
    ]
  },
  "roles": {
    "1": "Готов выйти из ворот если мяч пройдёт за защитников",
    "7": "Беги дугой, закрывай пас на одного защитника",
    "5": "Закрой их опорника, не дай развернуться"
  }
}
```

### Conventions

- Coordinates are **0–100 % of pitch dimensions** (resolution-independent). `x` is left-right (0 = left sideline, 100 = right). `y` is goal-to-goal (0 = our goal line, 100 = opponent's goal line).
- `initial` declares the starting positions of all players and the ball.
- `keyframes` are sparse — each keyframe declares only positions that *change*. Anything not mentioned keeps its previous value.
- `t` is normalized 0→1; the animator scales by `duration_ms`.
- `note` on each keyframe is the caption shown below the pitch when playback reaches that point.
- `layers` are togglable overlays. Drawn as SVG paths derived at render time from current positions.
- `roles` is per-player tooltip text for this scenario.

### Manifest schema (`scenarios/index.json`)

```json
{
  "formation": { "name": "2-3-1", "team": "Pivo" },
  "categories": [
    { "id": "shape", "title": "Оборона",   "emoji": "🛡" },
    { "id": "build", "title": "Розыгрыш",  "emoji": "🟢" },
    { "id": "press", "title": "Прессинг",  "emoji": "🔥" },
    { "id": "attack","title": "Атака",     "emoji": "⚽" }
  ],
  "scenarios": [
    { "id": "shape-low-block",      "file": "shape-low-block.json",      "category": "shape" },
    { "id": "shape-ball-on-flank",  "file": "shape-ball-on-flank.json",  "category": "shape" },
    { "id": "build-gk-short",       "file": "build-gk-short.json",       "category": "build" },
    { "id": "build-break-press",    "file": "build-break-press.json",    "category": "build" },
    { "id": "press-high-trigger",   "file": "press-high-trigger.json",   "category": "press" },
    { "id": "press-mid-block",      "file": "press-mid-block.json",      "category": "press" },
    { "id": "attack-overlap-right", "file": "attack-overlap-right.json", "category": "attack" },
    { "id": "attack-switch-play",   "file": "attack-switch-play.json",   "category": "attack" }
  ]
}
```

## Components

### `pitch.js`

Renders the SVG pitch and exposes:
- `renderPitch(svgEl)` — draws field lines, goals, center circle, penalty areas.
- `placePlayer(svgEl, playerId, x, y, opts)` — adds/updates a player marker.
- `placeBall(svgEl, x, y)` — adds/updates the ball.
- `drawTrails(svgEl, trailsData)` — dashed lines for "where I came from".
- `drawLayer(svgEl, layerType, layerData, currentPositions)` — passing lanes, press triggers, marking lines.
- `setHighlight(svgEl, playerId, on)` — toggles yellow pulsing ring.

The pitch coordinate system is the 0–100 % space defined in the data model; `pitch.js` converts to SVG units once at render.

### `animator.js`

Pure interpolation. Exposes:
- `createAnimator(scenario)` — returns `{ play, pause, seek, on('tick', fn), on('keyframe', fn) }`.
- Interpolates positions between keyframes with ease-in-out.
- Fires `keyframe` events as playback crosses each keyframe — `app.js` updates the caption and triggers highlight pulses.
- Driven by `requestAnimationFrame`.

### `app.js`

The orchestrator:
- Loads `scenarios/index.json` and renders the category chips.
- On scenario select: loads that scenario's JSON, resets pitch, builds animator, renders initial positions.
- Wires play/pause button, scrubber, layer toggles, player tap handlers.
- Manages app-level state: current scenario, current time, active layers, selected player tooltip.

### `styles.css`

Mobile-first. Single column. Pitch fills viewport width. Scenario chips horizontally scrollable. Caption strip below pitch. Controls below caption. Layer chips below controls. Tooltip is a small absolutely-positioned card that follows tapped player.

## Animation behavior

- Each scenario auto-restarts from beginning when selected.
- Hitting ▶ from a paused mid-state resumes from current position.
- Animation does not auto-loop. At t=1 it holds final positions until the viewer hits ▶ (which restarts from t=0) or selects another scenario.
- Scrubber drag pauses playback and seeks.
- Tapping a player toggles their tooltip but does not pause playback. Tapping outside any player closes the tooltip.
- Highlight ring auto-toggles based on the nearest keyframe in time — if any keyframe within 250 ms has `highlight: true` for a player, the ring is on.
- Movement trails: from each player's `initial` position to their current interpolated position. Drawn as a dashed line. Opacity fades from 1.0 at t=0 down to 0 at t=1 over the last 30 % of playback so the pitch is clean at the end.

## Scenarios (v1 content)

Eight scenarios, two per category. Author drafts in JSON; user reviews and tweaks.

1. **shape-low-block** — three mids drop next to defenders, forward stays high.
2. **shape-ball-on-flank** — whole team slides, far-side mid tucks inside.
3. **build-gk-short** — GK distributes; defenders split, central mid drops between them.
4. **build-break-press** — pressured defender returns to GK, GK switches diagonally to free side.
5. **press-high-trigger** — opponent GK has ball; forward presses with curved run, midfielders trap.
6. **press-mid-block** — compact in middle third, press triggers only when ball goes wide.
7. **attack-overlap-right** — wide midfielder + overlapping defender; forward drags CB.
8. **attack-switch-play** — left-side build draws opponent over; central mid switches to weak side 2v1.

## What's out of scope (v1)

- Editor — viewer cannot drag players or create scenarios.
- Multiple formations — only 2-3-1.
- Opponent player positions are implied by ball location and described in text; not rendered as separate markers on the pitch.
- Sound / narration.
- Persistence — no remembering which scenarios a user has watched.
- Analytics.
- Auth or access control (anyone with the URL sees everything; team-internal content only).

## Risks and open questions

- **Opponent invisible**: not drawing opponents keeps the pitch readable but loses some realism. If a scenario becomes unclear, we can add static gray dots for key opponent positions.
- **Vertical pitch on landscape phones**: pitch will be tall and narrow; acceptable since most viewing is portrait.
- **JSON authoring tedium**: writing keyframes by hand is annoying. If v1 grows past 12 scenarios, a tiny "drag the dots, copy the JSON" dev-only authoring page becomes worthwhile. Not in v1.

## Success criteria

- Page loads under 1 second on a phone on 4G.
- Each scenario plays smoothly (60 fps target) on a mid-range Android phone.
- A teammate who has never seen the page can open the URL, pick a scenario, watch the animation, and explain back what each player is supposed to do.
- All 8 v1 scenarios are tactically correct from the author's perspective.
