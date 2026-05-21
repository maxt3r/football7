# 7v7 Tactics Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, no-build static web page that animates 8 pre-authored 7v7 tactical scenarios (defensive shape, build-up, pressing, attacking) for a Russian-speaking amateur team.

**Architecture:** Vanilla ES module JS + SVG + JSON-data-driven scenarios. Three runtime modules — `pitch.js` (SVG rendering), `animator.js` (keyframe interpolation), `app.js` (orchestrator) — plus 8 scenario JSON files and a manifest. Pure logic (animator interpolation, scenario validation) gets TDD with `node:test`; rendering is verified manually via a local dev server.

**Tech Stack:**
- Vanilla JavaScript (ES modules)
- SVG (inline) for all visuals
- Plain CSS, mobile-first
- `node:test` (built-in) for unit tests, no other deps
- Python's `http.server` or `npx serve` for local preview
- GitHub Pages for hosting

**Spec:** [docs/superpowers/specs/2026-05-21-7v7-tactics-board-design.md](../specs/2026-05-21-7v7-tactics-board-design.md)

---

## v1 Execution Notes (user decisions, 2026-05-21)

**Skip all test steps.** For every task, skip any step that creates a `tests/*.js` file, runs `npm test`, or references TDD/red-green-refactor. Implement functions directly; rely on manual browser verification.
- Specifically: skip Task 1 step 2/3 (smoke test creation + run), skip Task 2 steps 1/2/4 (coord-conversion test), skip Task 4 steps 1/2/4 (interpolation tests), skip Task 5 steps 1/2/4 (animator runtime tests), skip Task 6 steps 3/4/6 (loader tests), skip Task 10 step 3 (`highlightedAt` test).
- Drop the `tests/` directory entirely. Drop the `"test"` script from `package.json` (keep `serve`).
- Functions/exports/signatures are still defined exactly as the implementation steps show — you're just not asserting them with tests.

**Skip Task 24 (GitHub Pages deployment) entirely.** End at Task 23 (mobile polish). The site runs locally via `python3 -m http.server 8000`.

---

## File Structure

Runtime (served to browser):
- `index.html` — single page, semantic regions for chips/pitch/caption/controls/layers/tooltip
- `styles.css` — mobile-first, dark UI, ~200 lines
- `app.js` — bootstrap, DOM wiring, state
- `pitch.js` — SVG rendering: pitch markings, players, ball, trails, layers, highlight
- `animator.js` — keyframe resolution + interpolation + play/pause/seek + events
- `scenarios/index.json` — manifest
- `scenarios/<id>.json` × 8 — one per scenario
- `assets/` — empty for now (ball is drawn as SVG)

Tooling:
- `package.json` — minimal, just for `npm test` script
- `tests/animator.test.js`
- `tests/scenario-loader.test.js`
- `.github/workflows/pages.yml` — deploy to GitHub Pages (optional, last task)

---

## Conventions Used Throughout

- **Coordinates:** scenario JSON uses `{x, y}` in 0–100 range. `x=0` = left sideline, `x=100` = right. `y=0` = our goal line (top of screen), `y=100` = opponent's goal (bottom). Pitch SVG uses a `viewBox="0 0 100 150"` (the pitch is taller than wide). `pitch.js` converts pitch-% to SVG units: `svgX = x`, `svgY = y * 1.5`.
- **Colors:** background `#0d0d0d`; pitch fill `#2d8a3e`; field lines `#ffffff`; outfield jersey `#1a1a1a` with orange `#ff9a3c` number; GK jersey `#5dff8a` with black number; ball `#ffffff`; highlight ring `#ffd84d`; trails `#ffd84d` 60% opacity.
- **Player IDs:** strings `"1"`–`"7"` (matches JSON keys).
- **DOM IDs:** `#chips`, `#pitch`, `#caption`, `#controls`, `#layers`, `#tooltip`.

---

## Task 1: Project skeleton — HTML + CSS shell + package.json + test runner check

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `package.json`
- Create: `tests/smoke.test.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "football7",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/",
    "serve": "python3 -m http.server 8000"
  }
}
```

- [ ] **Step 2: Create `tests/smoke.test.js` to confirm the test runner works**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('test runner works', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 3: Run the smoke test**

Run: `npm test`
Expected: one test passes, no failures.

- [ ] **Step 4: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0d0d0d">
  <title>Pivo · Тактика 7×7</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="hdr">
    <div class="hdr-title">Pivo · 2-3-1</div>
    <div class="hdr-count" id="scenario-count"></div>
  </header>

  <nav class="chips" id="chips" aria-label="Категории сценариев"></nav>

  <main class="pitch-wrap">
    <svg id="pitch" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet"
         role="img" aria-label="Тактическая схема"></svg>
    <div class="tooltip" id="tooltip" hidden></div>
  </main>

  <section class="caption" id="caption" aria-live="polite"></section>

  <div class="controls" id="controls">
    <button class="play-btn" id="play-btn" aria-label="Воспроизвести">▶</button>
    <div class="scrubber" id="scrubber">
      <div class="scrubber-track"><div class="scrubber-fill" id="scrubber-fill"></div></div>
      <div class="scrubber-thumb" id="scrubber-thumb"></div>
    </div>
    <div class="time" id="time">0.0 / 0.0с</div>
  </div>

  <div class="layers" id="layers" aria-label="Слои"></div>

  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `styles.css` shell**

```css
:root {
  --bg: #0d0d0d;
  --panel: #1a1a1a;
  --panel-2: #2a2a2a;
  --text: #f0f0f0;
  --muted: #888;
  --accent: #ff9a3c;
  --accent-2: #ffd84d;
  --pitch: #2d8a3e;
  --pitch-line: #ffffff;
  --gk: #5dff8a;
  --jersey: #1a1a1a;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

body {
  max-width: 480px;
  margin: 0 auto;
  padding: 12px 12px 24px;
  min-height: 100vh;
}

.hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px 10px;
}
.hdr-title { font-weight: 700; font-size: 16px; }
.hdr-count { color: var(--muted); font-size: 12px; }

.chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 2px 0 10px;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar { display: none; }
.chip {
  background: var(--panel-2);
  color: #bbb;
  padding: 6px 12px;
  border-radius: 14px;
  font-size: 12px;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  font: inherit;
}
.chip[aria-pressed="true"] {
  background: var(--accent);
  color: #000;
  font-weight: 600;
}

.pitch-wrap {
  position: relative;
  background: var(--pitch);
  border-radius: 10px;
  padding: 8px;
  margin: 4px 0 8px;
}
#pitch {
  width: 100%;
  height: auto;
  display: block;
  touch-action: manipulation;
}

.caption {
  background: var(--panel);
  border-left: 3px solid var(--accent-2);
  padding: 10px 12px;
  border-radius: 0 6px 6px 0;
  font-size: 13px;
  line-height: 1.5;
  margin: 8px 0;
  min-height: 38px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 2px;
  margin-top: 4px;
}
.play-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  border: none;
  font-size: 14px;
  cursor: pointer;
}
.scrubber { flex: 1; height: 18px; position: relative; touch-action: none; }
.scrubber-track {
  position: absolute; top: 7px; left: 0; right: 0; height: 4px;
  background: var(--panel-2); border-radius: 2px; overflow: hidden;
}
.scrubber-fill { height: 100%; width: 0; background: var(--accent); }
.scrubber-thumb {
  position: absolute; top: 4px; left: 0; width: 10px; height: 10px;
  border-radius: 50%; background: var(--accent);
  transform: translateX(-50%);
}
.time { color: var(--muted); font-size: 11px; min-width: 64px; text-align: right; }

.layers {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.tooltip {
  position: absolute;
  background: #111;
  border: 1px solid var(--accent-2);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.4;
  max-width: 220px;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.tooltip[hidden] { display: none; }
.tooltip-name { font-weight: 700; color: var(--accent-2); margin-bottom: 4px; }

/* SVG element styles */
.player-circle { transition: transform 0.1s linear; }
.player-label { font: 700 4px system-ui; fill: var(--text); text-anchor: middle; pointer-events: none; }
.player-number-outfield { font: 700 5px system-ui; fill: var(--accent); text-anchor: middle; pointer-events: none; }
.player-number-gk { font: 700 5px system-ui; fill: #000; text-anchor: middle; pointer-events: none; }
.field-line { stroke: var(--pitch-line); stroke-width: 0.4; fill: none; }
.trail { stroke: var(--accent-2); stroke-width: 0.4; fill: none; stroke-dasharray: 1.2 1; }
.ball { fill: #fff; stroke: #000; stroke-width: 0.3; }
.highlight-ring {
  fill: none;
  stroke: var(--accent-2);
  stroke-width: 0.5;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { stroke-opacity: 1; r: 4.5; }
  50% { stroke-opacity: 0.4; r: 5.5; }
}
.layer-path { stroke: var(--accent-2); stroke-width: 0.4; fill: none; opacity: 0.85; }
.layer-path.lane { stroke-dasharray: 2 1; }
.layer-path.trigger { stroke: #ff6b6b; }
.layer-path.cover { stroke: #6bcfff; stroke-dasharray: 1 1; }
.layer-label { font: 600 3px system-ui; fill: var(--accent-2); text-anchor: middle; }
```

- [ ] **Step 6: Create `app.js` stub so the page loads without 404s**

```javascript
console.log('app.js loaded');
```

- [ ] **Step 7: Start dev server and verify page loads**

Run: `npm run serve`
Open: http://localhost:8000

Expected: dark page with header "Pivo · 2-3-1", empty chips row, green pitch area (currently blank), empty caption, play button + empty scrubber.

- [ ] **Step 8: Commit**

```bash
git add package.json index.html styles.css app.js tests/smoke.test.js
git commit -m "Scaffold project: HTML/CSS shell, test runner, layout regions"
```

---

## Task 2: Coordinate utilities + pitch markings

**Files:**
- Create: `pitch.js`
- Create: `tests/pitch.test.js`

- [ ] **Step 1: Write failing test for coordinate conversion**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pitchToSvg, PITCH_W, PITCH_H } from '../pitch.js';

test('pitchToSvg maps 0-100 x to 0-100 svg x', () => {
  assert.deepEqual(pitchToSvg({ x: 0, y: 0 }),    { x: 0,   y: 0 });
  assert.deepEqual(pitchToSvg({ x: 100, y: 0 }),  { x: 100, y: 0 });
  assert.deepEqual(pitchToSvg({ x: 50, y: 50 }),  { x: 50,  y: 75 });
  assert.deepEqual(pitchToSvg({ x: 50, y: 100 }), { x: 50,  y: 150 });
});

test('PITCH_W and PITCH_H constants', () => {
  assert.equal(PITCH_W, 100);
  assert.equal(PITCH_H, 150);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with module not found / undefined exports.

- [ ] **Step 3: Implement `pitch.js` with constants and converter**

```javascript
// Pitch coordinate system: scenarios use 0..100 in both x and y.
// SVG coordinate system: 0..PITCH_W wide, 0..PITCH_H tall (pitch is taller than wide).
export const PITCH_W = 100;
export const PITCH_H = 150;

export function pitchToSvg({ x, y }) {
  return { x: x * (PITCH_W / 100), y: y * (PITCH_H / 100) };
}
```

- [ ] **Step 4: Verify the test passes**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Add `renderPitch` and verify visually**

Append to `pitch.js`:

```javascript
const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

export function renderPitch(svg) {
  // clear
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const g = el('g', { id: 'field' });

  // outer
  g.appendChild(el('rect', {
    x: 2, y: 2, width: PITCH_W - 4, height: PITCH_H - 4,
    class: 'field-line'
  }));
  // halfway line
  g.appendChild(el('line', {
    x1: 2, y1: PITCH_H / 2, x2: PITCH_W - 2, y2: PITCH_H / 2,
    class: 'field-line'
  }));
  // center circle
  g.appendChild(el('circle', {
    cx: PITCH_W / 2, cy: PITCH_H / 2, r: 12,
    class: 'field-line'
  }));
  g.appendChild(el('circle', { cx: PITCH_W / 2, cy: PITCH_H / 2, r: 0.8, fill: '#fff' }));

  // our penalty area (top)
  g.appendChild(el('rect', {
    x: 25, y: 2, width: 50, height: 22, class: 'field-line'
  }));
  // our goal area
  g.appendChild(el('rect', {
    x: 38, y: 2, width: 24, height: 10, class: 'field-line'
  }));
  // their penalty area (bottom)
  g.appendChild(el('rect', {
    x: 25, y: PITCH_H - 24, width: 50, height: 22, class: 'field-line'
  }));
  // their goal area
  g.appendChild(el('rect', {
    x: 38, y: PITCH_H - 12, width: 24, height: 10, class: 'field-line'
  }));

  svg.appendChild(g);

  // dedicated layer groups (always present, in this z-order)
  ['layers', 'trails', 'highlights', 'players', 'ball'].forEach(id => {
    svg.appendChild(el('g', { id: `g-${id}` }));
  });
}
```

- [ ] **Step 6: Wire `renderPitch` into `app.js` to verify visually**

Replace `app.js` with:

```javascript
import { renderPitch } from './pitch.js';

const svg = document.getElementById('pitch');
renderPitch(svg);
```

- [ ] **Step 7: Reload http://localhost:8000 and verify**

Expected: green pitch with white outline, halfway line, center circle and dot, and two penalty + goal areas at top and bottom.

- [ ] **Step 8: Commit**

```bash
git add pitch.js app.js tests/pitch.test.js
git commit -m "Render pitch markings with 0-100 coordinate system"
```

---

## Task 3: Player and ball rendering

**Files:**
- Modify: `pitch.js`
- Modify: `app.js`

- [ ] **Step 1: Add `placePlayer` and `placeBall` to `pitch.js`**

Append to `pitch.js`:

```javascript
const PLAYER_RADIUS = 4;

export function placePlayer(svg, id, x, y, opts = {}) {
  const layer = svg.querySelector('#g-players');
  const existing = layer.querySelector(`[data-player="${id}"]`);
  const p = pitchToSvg({ x, y });

  if (existing) {
    existing.querySelector('.player-circle').setAttribute('cx', p.x);
    existing.querySelector('.player-circle').setAttribute('cy', p.y);
    const num = existing.querySelector('text.player-number-outfield, text.player-number-gk');
    num.setAttribute('x', p.x); num.setAttribute('y', p.y + 1.8);
    const lbl = existing.querySelector('.player-label');
    lbl.setAttribute('x', p.x); lbl.setAttribute('y', p.y + 8);
    return existing;
  }

  const isGK = opts.isGK ?? id === '1';
  const g = el('g', { 'data-player': id, class: 'player' });
  g.appendChild(el('circle', {
    cx: p.x, cy: p.y, r: PLAYER_RADIUS,
    fill: isGK ? '#5dff8a' : '#1a1a1a',
    stroke: '#fff', 'stroke-width': 0.6,
    class: 'player-circle'
  }));
  g.appendChild(el('text', {
    x: p.x, y: p.y + 1.8,
    class: isGK ? 'player-number-gk' : 'player-number-outfield'
  })).textContent = id;
  g.appendChild(el('text', {
    x: p.x, y: p.y + 8,
    class: 'player-label'
  })).textContent = opts.name ?? '';

  layer.appendChild(g);
  return g;
}

export function placeBall(svg, x, y) {
  const layer = svg.querySelector('#g-ball');
  let ball = layer.querySelector('.ball');
  const p = pitchToSvg({ x, y });
  if (!ball) {
    ball = el('circle', { r: 1.6, class: 'ball' });
    layer.appendChild(ball);
  }
  ball.setAttribute('cx', p.x);
  ball.setAttribute('cy', p.y);
  return ball;
}

export function clearPlayers(svg) {
  const layer = svg.querySelector('#g-players');
  while (layer.firstChild) layer.removeChild(layer.firstChild);
}
```

- [ ] **Step 2: Update `app.js` to render the default 2-3-1 formation**

Replace `app.js` with:

```javascript
import { renderPitch, placePlayer, placeBall, clearPlayers } from './pitch.js';

const PLAYER_NAMES = {
  '1': 'Егор', '2': 'Леша', '3': 'Дима',
  '4': 'Мася', '5': 'Ашот', '6': 'Максим',
  '7': 'Сережа'
};

const DEFAULT_FORMATION = {
  ball: { x: 50, y: 50 },
  players: {
    '1': { x: 50, y: 8 },
    '2': { x: 30, y: 30 },
    '3': { x: 70, y: 30 },
    '6': { x: 22, y: 50 },
    '5': { x: 50, y: 50 },
    '4': { x: 78, y: 50 },
    '7': { x: 50, y: 75 }
  }
};

const svg = document.getElementById('pitch');
renderPitch(svg);

for (const [id, pos] of Object.entries(DEFAULT_FORMATION.players)) {
  placePlayer(svg, id, pos.x, pos.y, { name: PLAYER_NAMES[id] });
}
placeBall(svg, DEFAULT_FORMATION.ball.x, DEFAULT_FORMATION.ball.y);
```

- [ ] **Step 3: Reload http://localhost:8000 and verify**

Expected: 2-3-1 formation visible — green GK at top labeled "Егор · 1", two black defenders, three midfielders, one forward at bottom, ball at center. Numbers are orange on dark jerseys, black on the green GK jersey.

- [ ] **Step 4: Commit**

```bash
git add pitch.js app.js
git commit -m "Render players and ball with default 2-3-1 formation"
```

---

## Task 4: Animator core — keyframe resolution and interpolation

**Files:**
- Create: `animator.js`
- Create: `tests/animator.test.js`

- [ ] **Step 1: Write failing tests for `resolvePositions`**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePositions, easeInOut, interpolatePositions } from '../animator.js';

const scenario = {
  initial: {
    ball: { x: 50, y: 50 },
    players: {
      '1': { x: 10, y: 10 },
      '7': { x: 90, y: 90 }
    }
  },
  keyframes: [
    { t: 0,    note: 'start' },
    { t: 0.5,  note: 'mid',   players: { '7': { x: 50, y: 50 } } },
    { t: 1,    note: 'end',   players: { '7': { x: 50, y: 20 } }, ball: { x: 70, y: 30 } }
  ]
};

test('resolvePositions at t=0 returns initial', () => {
  const s = resolvePositions(scenario, 0);
  assert.deepEqual(s.players['1'], { x: 10, y: 10 });
  assert.deepEqual(s.players['7'], { x: 90, y: 90 });
  assert.deepEqual(s.ball, { x: 50, y: 50 });
});

test('resolvePositions snapshots full state at a keyframe', () => {
  const s = resolvePositions(scenario, 0.5);
  assert.deepEqual(s.players['7'], { x: 50, y: 50 });
  assert.deepEqual(s.players['1'], { x: 10, y: 10 }); // unchanged
  assert.deepEqual(s.ball, { x: 50, y: 50 });        // unchanged
});

test('resolvePositions at final keyframe uses final values', () => {
  const s = resolvePositions(scenario, 1);
  assert.deepEqual(s.players['7'], { x: 50, y: 20 });
  assert.deepEqual(s.ball, { x: 70, y: 30 });
});

test('resolvePositions interpolates between keyframes', () => {
  // halfway between t=0.5 (7@50,50) and t=1 (7@50,20). With easeInOut(0.5)=0.5,
  // expect exactly midpoint: (50, 35).
  const s = resolvePositions(scenario, 0.75);
  assert.equal(s.players['7'].x, 50);
  assert.equal(s.players['7'].y, 35);
});

test('easeInOut is symmetric: f(0)=0, f(0.5)=0.5, f(1)=1', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(0.5), 0.5);
  assert.equal(easeInOut(1), 1);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `animator.js` resolution + interpolation**

```javascript
// animator.js — keyframe interpolation and playback control.
// Pure logic in resolvePositions; runtime (play/pause) added in next task.

export function easeInOut(t) {
  // Standard cubic ease-in-out: symmetric around 0.5
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function interpolatePositions(a, b, alpha) {
  return { x: a.x + (b.x - a.x) * alpha, y: a.y + (b.y - a.y) * alpha };
}

// Build a per-id timeline of {t, value} samples from the keyframes,
// starting from the initial value at t=0 (if not overridden by a keyframe at t=0).
function timeline(initialValue, keyframes, accessor) {
  const samples = [];
  let lastValue = initialValue;
  for (const kf of keyframes) {
    const v = accessor(kf);
    if (v !== undefined) lastValue = v;
    samples.push({ t: kf.t, value: lastValue });
  }
  // Ensure there's a sample at t=0
  if (samples.length === 0 || samples[0].t > 0) {
    samples.unshift({ t: 0, value: initialValue });
  }
  return samples;
}

function sampleAt(samples, t) {
  if (t <= samples[0].t) return samples[0].value;
  if (t >= samples[samples.length - 1].t) return samples[samples.length - 1].value;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const alpha = span === 0 ? 0 : easeInOut((t - a.t) / span);
      return interpolatePositions(a.value, b.value, alpha);
    }
  }
  return samples[samples.length - 1].value;
}

export function resolvePositions(scenario, t) {
  const players = {};
  for (const id of Object.keys(scenario.initial.players)) {
    const samples = timeline(
      scenario.initial.players[id],
      scenario.keyframes,
      (kf) => kf.players?.[id]
    );
    players[id] = sampleAt(samples, t);
  }
  const ballSamples = timeline(
    scenario.initial.ball,
    scenario.keyframes,
    (kf) => kf.ball
  );
  const ball = sampleAt(ballSamples, t);
  return { players, ball };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add animator.js tests/animator.test.js
git commit -m "Add keyframe interpolation with ease-in-out"
```

---

## Task 5: Animator runtime — play/pause/seek + events

**Files:**
- Modify: `animator.js`
- Modify: `tests/animator.test.js`

- [ ] **Step 1: Add failing tests for `createAnimator`**

Append to `tests/animator.test.js`:

```javascript
import { createAnimator } from '../animator.js';

const tinyScenario = {
  duration_ms: 1000,
  initial: { ball: { x: 50, y: 50 }, players: { '1': { x: 10, y: 10 } } },
  keyframes: [
    { t: 0,   note: 'a' },
    { t: 0.5, note: 'b' },
    { t: 1,   note: 'c' }
  ]
};

test('createAnimator starts paused at t=0', () => {
  const a = createAnimator(tinyScenario);
  assert.equal(a.getTime(), 0);
  assert.equal(a.isPlaying(), false);
});

test('seek clamps to [0, duration_ms] and stays paused', () => {
  const a = createAnimator(tinyScenario);
  a.seek(500);
  assert.equal(a.getTime(), 500);
  a.seek(-100);
  assert.equal(a.getTime(), 0);
  a.seek(99999);
  assert.equal(a.getTime(), 1000);
  assert.equal(a.isPlaying(), false);
});

test('tick advances time and emits tick events', () => {
  const a = createAnimator(tinyScenario);
  const ticks = [];
  a.on('tick', (e) => ticks.push(e.time));
  a.play();
  a._tickFor(300); // private helper for tests: advances clock by ms
  assert.equal(a.getTime(), 300);
  assert.ok(ticks.length > 0, 'tick fired');
  assert.equal(ticks[ticks.length - 1], 300);
});

test('keyframe events fire when crossing a keyframe boundary', () => {
  const a = createAnimator(tinyScenario);
  const crossings = [];
  a.on('keyframe', (e) => crossings.push(e.keyframe.note));
  a.play();
  // first frame at t=0 fires the t=0 keyframe
  a._tickFor(0);
  // advance past 0.5 boundary (500ms)
  a._tickFor(600);
  // advance to end
  a._tickFor(400);
  assert.deepEqual(crossings, ['a', 'b', 'c']);
});

test('play to end stops automatically and holds final time', () => {
  const a = createAnimator(tinyScenario);
  a.play();
  a._tickFor(2000); // overshoot
  assert.equal(a.getTime(), 1000);
  assert.equal(a.isPlaying(), false);
});

test('play after reaching end restarts from 0', () => {
  const a = createAnimator(tinyScenario);
  a.play();
  a._tickFor(2000);
  a.play();
  assert.equal(a.getTime(), 0);
  assert.equal(a.isPlaying(), true);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `createAnimator is not a function`.

- [ ] **Step 3: Implement `createAnimator` in `animator.js`**

Append to `animator.js`:

```javascript
export function createAnimator(scenario) {
  const duration = scenario.duration_ms;
  let timeMs = 0;
  let playing = false;
  let rafId = null;
  let lastFrameTime = null;
  let lastCrossedIdx = -1;
  const listeners = { tick: [], keyframe: [] };

  function emit(type, payload) {
    for (const fn of listeners[type]) fn(payload);
  }

  function checkKeyframes(prevMs, nextMs) {
    for (let i = 0; i < scenario.keyframes.length; i++) {
      const kfMs = scenario.keyframes[i].t * duration;
      const crossedNow = kfMs >= prevMs && kfMs <= nextMs && i > lastCrossedIdx;
      if (crossedNow) {
        lastCrossedIdx = i;
        emit('keyframe', { index: i, keyframe: scenario.keyframes[i], time: nextMs });
      }
    }
  }

  function stepTo(newMs) {
    const prev = timeMs;
    timeMs = Math.max(0, Math.min(duration, newMs));
    // Use a tiny negative epsilon so prev=0 fires the t=0 keyframe on first tick
    checkKeyframes(prev === 0 && lastCrossedIdx < 0 ? -1 : prev, timeMs);
    emit('tick', { time: timeMs, t: timeMs / duration });
    if (timeMs >= duration) {
      playing = false;
      cancelAnimationFrame(rafId);
    }
  }

  function frame(now) {
    if (!playing) return;
    const dt = lastFrameTime == null ? 0 : (now - lastFrameTime);
    lastFrameTime = now;
    stepTo(timeMs + dt);
    if (playing) rafId = requestAnimationFrame(frame);
  }

  return {
    play() {
      if (timeMs >= duration) {
        timeMs = 0;
        lastCrossedIdx = -1;
      }
      playing = true;
      lastFrameTime = null;
      // In browsers: schedule rAF. In Node tests: caller uses _tickFor.
      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(frame);
      }
    },
    pause() {
      playing = false;
      if (rafId != null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
    },
    seek(ms) {
      this.pause();
      const clamped = Math.max(0, Math.min(duration, ms));
      timeMs = clamped;
      // reset crossed tracking so events fire correctly on the next play
      lastCrossedIdx = -1;
      for (let i = 0; i < scenario.keyframes.length; i++) {
        if (scenario.keyframes[i].t * duration <= clamped) lastCrossedIdx = i;
      }
      emit('tick', { time: timeMs, t: timeMs / duration });
    },
    getTime() { return timeMs; },
    duration() { return duration; },
    isPlaying() { return playing; },
    on(type, fn) { listeners[type].push(fn); },
    // Test-only helper: advances time deterministically without rAF.
    _tickFor(deltaMs) { stepTo(timeMs + deltaMs); }
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add animator.js tests/animator.test.js
git commit -m "Animator runtime: play/pause/seek + tick/keyframe events"
```

---

## Task 6: Scenario loading + manifest

**Files:**
- Create: `scenarios/index.json`
- Create: `scenarios/_demo.json`
- Create: `loader.js`
- Create: `tests/loader.test.js`

This task ships one *demo* scenario so we can wire up the UI before the real content tasks. The 8 real scenarios come later.

- [ ] **Step 1: Create `scenarios/index.json`**

```json
{
  "formation": { "name": "2-3-1", "team": "Pivo" },
  "categories": [
    { "id": "shape",  "title": "Оборона",   "emoji": "🛡" },
    { "id": "build",  "title": "Розыгрыш",  "emoji": "🟢" },
    { "id": "press",  "title": "Прессинг",  "emoji": "🔥" },
    { "id": "attack", "title": "Атака",     "emoji": "⚽" }
  ],
  "scenarios": [
    { "id": "_demo", "file": "_demo.json", "category": "shape" }
  ]
}
```

- [ ] **Step 2: Create `scenarios/_demo.json`**

```json
{
  "id": "_demo",
  "category": "shape",
  "title": "Демо — все на месте, потом сдвиг",
  "subtitle": "Временный сценарий для отладки UI",
  "duration_ms": 3000,
  "ball_side": "ours",
  "initial": {
    "ball": { "x": 50, "y": 50 },
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
    { "t": 0,   "note": "Старт" },
    { "t": 0.5, "note": "Все смещаются вверх", "players": {
        "2": { "x": 30, "y": 40 },
        "3": { "x": 70, "y": 40 },
        "7": { "x": 50, "y": 60, "highlight": true }
      }
    },
    { "t": 1,   "note": "Возвращаемся", "players": {
        "2": { "x": 30, "y": 30 },
        "3": { "x": 70, "y": 30 },
        "7": { "x": 50, "y": 75 }
      }
    }
  ],
  "layers": {},
  "roles": {
    "7": "Демо роль — двигайся по сигналу"
  }
}
```

- [ ] **Step 3: Write failing test for `loadManifest` + `validateScenario`**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateScenario } from '../loader.js';

const valid = {
  id: 'x', category: 'shape', title: 't', duration_ms: 1000,
  initial: { ball: { x: 50, y: 50 }, players: { '1': { x: 0, y: 0 } } },
  keyframes: [{ t: 0, note: 'a' }, { t: 1, note: 'b' }]
};

test('validateScenario passes a valid scenario', () => {
  assert.doesNotThrow(() => validateScenario(valid));
});

test('validateScenario rejects missing duration_ms', () => {
  const bad = { ...valid, duration_ms: undefined };
  assert.throws(() => validateScenario(bad), /duration_ms/);
});

test('validateScenario rejects keyframes that are not sorted by t', () => {
  const bad = { ...valid, keyframes: [{ t: 0 }, { t: 0.8 }, { t: 0.5 }] };
  assert.throws(() => validateScenario(bad), /sorted/);
});

test('validateScenario rejects coords out of 0..100', () => {
  const bad = { ...valid, initial: { ball: { x: -1, y: 50 }, players: { '1': { x: 0, y: 0 } } } };
  assert.throws(() => validateScenario(bad), /out of range/);
});

test('validateScenario rejects empty keyframes', () => {
  const bad = { ...valid, keyframes: [] };
  assert.throws(() => validateScenario(bad), /keyframes/);
});
```

- [ ] **Step 4: Run to verify failure**

Run: `npm test`
Expected: FAIL — loader.js not found.

- [ ] **Step 5: Implement `loader.js`**

```javascript
// loader.js — fetches manifest and scenarios; validates schema.

function isCoord(v) {
  return v && typeof v.x === 'number' && typeof v.y === 'number'
    && v.x >= 0 && v.x <= 100 && v.y >= 0 && v.y <= 100;
}

export function validateScenario(s) {
  if (!s || typeof s !== 'object') throw new Error('scenario must be an object');
  for (const key of ['id', 'category', 'title']) {
    if (typeof s[key] !== 'string') throw new Error(`${key} must be a string`);
  }
  if (typeof s.duration_ms !== 'number' || s.duration_ms <= 0) {
    throw new Error('duration_ms must be a positive number');
  }
  if (!s.initial || !isCoord(s.initial.ball)) {
    throw new Error('initial.ball coord out of range or missing');
  }
  if (!s.initial.players || Object.keys(s.initial.players).length === 0) {
    throw new Error('initial.players must have at least one player');
  }
  for (const [id, p] of Object.entries(s.initial.players)) {
    if (!isCoord(p)) throw new Error(`initial.players.${id} coord out of range`);
  }
  if (!Array.isArray(s.keyframes) || s.keyframes.length === 0) {
    throw new Error('keyframes must be a non-empty array');
  }
  let last = -1;
  for (const kf of s.keyframes) {
    if (typeof kf.t !== 'number' || kf.t < 0 || kf.t > 1) {
      throw new Error('keyframe.t must be in [0, 1]');
    }
    if (kf.t < last) throw new Error('keyframes must be sorted by t');
    last = kf.t;
    if (kf.ball && !isCoord(kf.ball)) throw new Error('keyframe.ball coord out of range');
    if (kf.players) {
      for (const [id, p] of Object.entries(kf.players)) {
        if (!isCoord(p)) throw new Error(`keyframe.players.${id} coord out of range`);
      }
    }
  }
  return s;
}

export async function loadManifest(baseUrl = './scenarios/') {
  const r = await fetch(baseUrl + 'index.json');
  if (!r.ok) throw new Error(`manifest fetch failed: ${r.status}`);
  return r.json();
}

export async function loadScenario(id, baseUrl = './scenarios/') {
  const r = await fetch(`${baseUrl}${id}.json`);
  if (!r.ok) throw new Error(`scenario ${id} fetch failed: ${r.status}`);
  const data = await r.json();
  return validateScenario(data);
}
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add scenarios/ loader.js tests/loader.test.js
git commit -m "Scenario manifest + loader + validation; ship _demo scenario"
```

---

## Task 7: Wire app — load manifest, render chips, render demo scenario

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Rewrite `app.js` to load manifest and chips**

```javascript
import { renderPitch, placePlayer, placeBall, clearPlayers } from './pitch.js';
import { loadManifest, loadScenario } from './loader.js';
import { createAnimator, resolvePositions } from './animator.js';

const PLAYER_NAMES = {
  '1': 'Егор', '2': 'Леша', '3': 'Дима',
  '4': 'Мася', '5': 'Ашот', '6': 'Максим',
  '7': 'Сережа'
};

const svg = document.getElementById('pitch');
const chipsEl = document.getElementById('chips');
const captionEl = document.getElementById('caption');
const countEl = document.getElementById('scenario-count');

const state = {
  manifest: null,
  scenario: null,
  animator: null,
  selectedCategory: null
};

function renderState(positions) {
  for (const [id, pos] of Object.entries(positions.players)) {
    placePlayer(svg, id, pos.x, pos.y, { name: PLAYER_NAMES[id] });
  }
  placeBall(svg, positions.ball.x, positions.ball.y);
}

function renderChips() {
  chipsEl.innerHTML = '';
  for (const cat of state.manifest.categories) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = `${cat.emoji} ${cat.title}`;
    btn.setAttribute('aria-pressed', cat.id === state.selectedCategory ? 'true' : 'false');
    btn.addEventListener('click', () => selectCategory(cat.id));
    chipsEl.appendChild(btn);
  }
}

async function selectCategory(catId) {
  state.selectedCategory = catId;
  renderChips();
  const inCat = state.manifest.scenarios.filter(s => s.category === catId);
  if (inCat.length > 0) {
    await selectScenario(inCat[0].id);
  }
}

async function selectScenario(id) {
  state.scenario = await loadScenario(id);
  state.animator = createAnimator(state.scenario);
  clearPlayers(svg);
  const positions = resolvePositions(state.scenario, 0);
  renderState(positions);
  captionEl.textContent = state.scenario.keyframes[0].note ?? state.scenario.title;
  state.animator.on('tick', (e) => {
    const pos = resolvePositions(state.scenario, e.t);
    renderState(pos);
  });
  state.animator.on('keyframe', (e) => {
    if (e.keyframe.note) captionEl.textContent = e.keyframe.note;
  });
}

async function boot() {
  renderPitch(svg);
  state.manifest = await loadManifest();
  countEl.textContent = `${state.manifest.scenarios.length} сценариев`;
  await selectCategory(state.manifest.categories[0].id);
}

boot().catch((err) => {
  console.error(err);
  captionEl.textContent = `Ошибка: ${err.message}`;
});
```

- [ ] **Step 2: Reload http://localhost:8000 and verify**

Expected: 4 chips appear ("🛡 Оборона", "🟢 Розыгрыш", "🔥 Прессинг", "⚽ Атака"), first chip highlighted orange, demo scenario auto-selected, players visible in initial positions, caption shows "Старт", count shows "1 сценариев".

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "Load manifest, render chips, auto-select first scenario"
```

---

## Task 8: Play / pause / restart button

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Wire play button + time display**

Add to `app.js`, after the `selectScenario` function:

```javascript
const playBtn = document.getElementById('play-btn');
const timeEl = document.getElementById('time');

function updatePlayBtn() {
  if (!state.animator) return;
  playBtn.textContent = state.animator.isPlaying() ? '⏸' : '▶';
  playBtn.setAttribute('aria-label', state.animator.isPlaying() ? 'Пауза' : 'Воспроизвести');
}

function updateTime() {
  if (!state.animator) return;
  const cur = (state.animator.getTime() / 1000).toFixed(1);
  const tot = (state.animator.duration() / 1000).toFixed(1);
  timeEl.textContent = `${cur} / ${tot}с`;
}

playBtn.addEventListener('click', () => {
  if (!state.animator) return;
  if (state.animator.isPlaying()) state.animator.pause();
  else state.animator.play();
  updatePlayBtn();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && state.animator) {
    e.preventDefault();
    playBtn.click();
  }
});
```

And inside `selectScenario`, before adding the `on('tick')` listener, replace the existing tick handler with one that also updates time + button:

```javascript
  state.animator.on('tick', (e) => {
    const pos = resolvePositions(state.scenario, e.t);
    renderState(pos);
    updateTime();
    if (!state.animator.isPlaying()) updatePlayBtn();
  });
```

Also call `updateTime()` and `updatePlayBtn()` once at the end of `selectScenario`.

- [ ] **Step 2: Reload and verify**

Expected: ▶ button plays the demo scenario; players slide up at t=0.5, return at t=1. Caption updates to "Все смещаются вверх" then "Возвращаемся". Button flips to ⏸ during playback and back to ▶ at end. Spacebar also toggles. Time display ticks.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "Play/pause button, time display, spacebar toggle"
```

---

## Task 9: Scrubber

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add scrubber drag handling**

Add to `app.js`:

```javascript
const scrubber = document.getElementById('scrubber');
const scrubberFill = document.getElementById('scrubber-fill');
const scrubberThumb = document.getElementById('scrubber-thumb');

function updateScrubber() {
  if (!state.animator) return;
  const frac = state.animator.getTime() / state.animator.duration();
  const pct = (frac * 100).toFixed(2) + '%';
  scrubberFill.style.width = pct;
  scrubberThumb.style.left = pct;
}

function seekFromPointer(clientX) {
  if (!state.animator) return;
  const rect = scrubber.getBoundingClientRect();
  const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  state.animator.seek(frac * state.animator.duration());
  updatePlayBtn();
}

let dragging = false;
scrubber.addEventListener('pointerdown', (e) => {
  dragging = true;
  scrubber.setPointerCapture(e.pointerId);
  seekFromPointer(e.clientX);
});
scrubber.addEventListener('pointermove', (e) => {
  if (dragging) seekFromPointer(e.clientX);
});
scrubber.addEventListener('pointerup', (e) => {
  dragging = false;
  scrubber.releasePointerCapture(e.pointerId);
});
```

Also call `updateScrubber()` inside the existing `on('tick')` handler and at the end of `selectScenario`.

- [ ] **Step 2: Reload and verify**

Expected: scrubber fills from left to right during playback. Tapping or dragging on it pauses playback and seeks; pitch state updates instantly. Time display matches.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "Add scrubber with drag-to-seek (pauses playback)"
```

---

## Task 10: Highlight ring (auto-toggle based on nearest keyframe)

**Files:**
- Modify: `pitch.js`
- Modify: `app.js`

- [ ] **Step 1: Add highlight rendering to `pitch.js`**

Append:

```javascript
export function setHighlights(svg, playerIds) {
  const layer = svg.querySelector('#g-highlights');
  while (layer.firstChild) layer.removeChild(layer.firstChild);
  for (const id of playerIds) {
    const player = svg.querySelector(`[data-player="${id}"] .player-circle`);
    if (!player) continue;
    const cx = player.getAttribute('cx');
    const cy = player.getAttribute('cy');
    const ring = el('circle', { cx, cy, r: 5, class: 'highlight-ring' });
    layer.appendChild(ring);
  }
}
```

- [ ] **Step 2: Add highlight resolution to `animator.js`**

Append to `animator.js`:

```javascript
// Returns the set of player IDs that should be highlighted at the given time.
// A player is highlighted if any keyframe within HIGHLIGHT_WINDOW_MS of `timeMs`
// has `highlight: true` for that player.
export const HIGHLIGHT_WINDOW_MS = 250;

export function highlightedAt(scenario, timeMs) {
  const out = new Set();
  for (const kf of scenario.keyframes) {
    const kfMs = kf.t * scenario.duration_ms;
    if (Math.abs(kfMs - timeMs) <= HIGHLIGHT_WINDOW_MS && kf.players) {
      for (const [id, p] of Object.entries(kf.players)) {
        if (p.highlight) out.add(id);
      }
    }
  }
  return out;
}
```

- [ ] **Step 3: Add a quick test for `highlightedAt`**

Append to `tests/animator.test.js`:

```javascript
import { highlightedAt } from '../animator.js';

test('highlightedAt returns players with highlight at nearby keyframes', () => {
  const sc = {
    duration_ms: 1000,
    initial: { ball: { x:0, y:0 }, players: { '7': { x:0, y:0 }, '5': { x:0, y:0 } } },
    keyframes: [
      { t: 0 },
      { t: 0.5, players: { '7': { x: 1, y: 1, highlight: true } } },
      { t: 1 }
    ]
  };
  assert.deepEqual([...highlightedAt(sc, 500)], ['7']);
  assert.deepEqual([...highlightedAt(sc, 400)], ['7']); // within 250ms window
  assert.deepEqual([...highlightedAt(sc, 100)], []);    // too far
});
```

Run: `npm test` → all pass.

- [ ] **Step 4: Wire highlights into `app.js` tick handler**

Expand the existing top-of-file imports:

```javascript
import { renderPitch, placePlayer, placeBall, clearPlayers, setHighlights } from './pitch.js';
import { createAnimator, resolvePositions, highlightedAt } from './animator.js';
```

Inside the `on('tick')` handler:

```javascript
  state.animator.on('tick', (e) => {
    const pos = resolvePositions(state.scenario, e.t);
    renderState(pos);
    setHighlights(svg, highlightedAt(state.scenario, e.time));
    updateTime();
    updateScrubber();
    if (!state.animator.isPlaying()) updatePlayBtn();
  });
```

Also call `setHighlights(svg, highlightedAt(state.scenario, 0))` at the end of `selectScenario`.

- [ ] **Step 5: Reload and verify**

Expected: when demo scenario reaches t=0.5, player #7 gets a pulsing yellow ring. Ring goes away as time advances past the window.

- [ ] **Step 6: Commit**

```bash
git add pitch.js animator.js app.js tests/animator.test.js
git commit -m "Highlight ring with auto-toggle from keyframe flags"
```

---

## Task 11: Movement trails

**Files:**
- Modify: `pitch.js`
- Modify: `app.js`

- [ ] **Step 1: Add `drawTrails` to `pitch.js`**

Append:

```javascript
// trailsData = [{ id, from: {x,y}, to: {x,y} }, ...]; opacity in [0,1]
export function drawTrails(svg, trailsData, opacity) {
  const layer = svg.querySelector('#g-trails');
  while (layer.firstChild) layer.removeChild(layer.firstChild);
  if (opacity <= 0) return;
  layer.setAttribute('opacity', opacity);
  for (const t of trailsData) {
    const a = pitchToSvg(t.from);
    const b = pitchToSvg(t.to);
    layer.appendChild(el('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'trail'
    }));
  }
}
```

- [ ] **Step 2: Wire trails into `app.js` tick handler**

Expand the existing `pitch.js` import to include `drawTrails`:

```javascript
import { renderPitch, placePlayer, placeBall, clearPlayers, setHighlights, drawTrails } from './pitch.js';
```

Inside the tick handler, compute trails after position resolution:

```javascript
  state.animator.on('tick', (e) => {
    const pos = resolvePositions(state.scenario, e.t);
    renderState(pos);
    setHighlights(svg, highlightedAt(state.scenario, e.time));
    const trails = Object.entries(state.scenario.initial.players).map(([id, from]) => ({
      id, from, to: pos.players[id]
    }));
    // fade trails over the last 30 % of playback
    const fadeStart = 0.7;
    const opacity = e.t <= fadeStart ? 0.6 : 0.6 * (1 - (e.t - fadeStart) / (1 - fadeStart));
    drawTrails(svg, trails, opacity);
    updateTime();
    updateScrubber();
    if (!state.animator.isPlaying()) updatePlayBtn();
  });
```

Also call `drawTrails(svg, [], 0)` at the end of `selectScenario` to clear any prior trails.

- [ ] **Step 3: Reload and verify**

Expected: as the demo scenario plays, dashed yellow lines appear from each player's starting position to their current position. Lines fade after t=0.7 and are gone by t=1.

- [ ] **Step 4: Commit**

```bash
git add pitch.js app.js
git commit -m "Movement trails with fade in final 30% of playback"
```

---

## Task 12: Player tap → role tooltip

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Make player groups interactive and wire tooltip**

Add to `app.js`:

```javascript
const tooltipEl = document.getElementById('tooltip');
const pitchWrap = document.querySelector('.pitch-wrap');

function hideTooltip() {
  tooltipEl.hidden = true;
  tooltipEl.dataset.player = '';
}

function showTooltip(playerId, clientX, clientY) {
  if (!state.scenario) return;
  const role = state.scenario.roles?.[playerId];
  tooltipEl.innerHTML = `
    <div class="tooltip-name">${PLAYER_NAMES[playerId]} · ${playerId}</div>
    <div>${role ?? 'Нет особой роли в этом сценарии'}</div>
  `;
  tooltipEl.hidden = false;
  tooltipEl.dataset.player = playerId;
  const wrapRect = pitchWrap.getBoundingClientRect();
  const x = clientX - wrapRect.left + 12;
  const y = clientY - wrapRect.top + 12;
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

svg.addEventListener('click', (e) => {
  const playerGroup = e.target.closest('[data-player]');
  if (playerGroup) {
    const id = playerGroup.dataset.player;
    if (tooltipEl.dataset.player === id) {
      hideTooltip();
    } else {
      showTooltip(id, e.clientX, e.clientY);
    }
  } else {
    hideTooltip();
  }
});

document.addEventListener('click', (e) => {
  // close tooltip when tapping outside the pitch entirely
  if (!pitchWrap.contains(e.target)) hideTooltip();
});
```

Also call `hideTooltip()` at the start of `selectScenario`.

- [ ] **Step 2: Make player groups respond to pointer events**

In `pitch.js`, in `placePlayer`, set `style="cursor: pointer"` on the group (or via CSS class). Add to `styles.css`:

```css
.player { cursor: pointer; }
```

- [ ] **Step 3: Reload and verify**

Expected: tapping on player #7 shows "Сережа · 7" + the role from `_demo.json` ("Демо роль — двигайся по сигналу"). Tapping again hides. Tapping a different player switches. Tapping empty pitch hides. Playback continues uninterrupted.

- [ ] **Step 4: Commit**

```bash
git add app.js pitch.js styles.css
git commit -m "Tap player to show role tooltip; does not pause playback"
```

---

## Task 13: Layer rendering (passing lanes, press triggers, covering)

**Files:**
- Modify: `pitch.js`
- Modify: `app.js`
- Modify: `scenarios/_demo.json`

The demo scenario gets a small `layers` block so we can test all three layer types.

- [ ] **Step 1: Add `drawLayers` to `pitch.js`**

Append:

```javascript
// activeLayers: Set of layer-type strings, e.g. new Set(['press_triggers'])
// layers: scenario.layers map
// positions: current resolved positions { ball, players }
export function drawLayers(svg, layers, activeLayers, positions) {
  const layer = svg.querySelector('#g-layers');
  while (layer.firstChild) layer.removeChild(layer.firstChild);
  if (!layers) return;

  for (const layerType of activeLayers) {
    const items = layers[layerType];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      renderLayerItem(layer, layerType, item, positions);
    }
  }
}

function renderLayerItem(parent, type, item, positions) {
  const fromPos = item.from != null ? positions.players[String(item.from)] : null;
  const toPos = item.to != null ? positions.players[String(item.to)]
              : item.to_ball ? positions.ball
              : null;
  if (!fromPos || !toPos) return;

  const a = pitchToSvg(fromPos);
  const b = pitchToSvg(toPos);

  // class per layer type drives color/dash
  const cls = type === 'press_triggers' ? 'layer-path trigger'
            : type === 'lanes' ? 'layer-path lane'
            : type === 'covering' ? 'layer-path cover'
            : 'layer-path';

  const path = el('line', {
    x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls
  });
  parent.appendChild(path);

  if (item.label) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - 2;
    const txt = el('text', { x: mx, y: my, class: 'layer-label' });
    txt.textContent = item.label;
    parent.appendChild(txt);
  }
}
```

- [ ] **Step 2: Wire layer chips and rendering in `app.js`**

Expand the existing `pitch.js` import to include `drawLayers`:

```javascript
import { renderPitch, placePlayer, placeBall, clearPlayers, setHighlights, drawTrails, drawLayers } from './pitch.js';
```

Add to `app.js`:

```javascript
const layersEl = document.getElementById('layers');
const LAYER_LABELS = {
  press_triggers: 'Триггеры прессинга',
  lanes: 'Линии паса',
  covering: 'Опека'
};
const activeLayers = new Set();

function renderLayerChips() {
  layersEl.innerHTML = '';
  if (!state.scenario?.layers) return;
  for (const type of Object.keys(state.scenario.layers)) {
    const label = LAYER_LABELS[type] ?? type;
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = label;
    btn.setAttribute('aria-pressed', activeLayers.has(type) ? 'true' : 'false');
    btn.addEventListener('click', () => {
      if (activeLayers.has(type)) activeLayers.delete(type);
      else activeLayers.add(type);
      btn.setAttribute('aria-pressed', activeLayers.has(type) ? 'true' : 'false');
      // immediately repaint layers using current positions
      const pos = resolvePositions(state.scenario, state.animator.getTime() / state.animator.duration());
      drawLayers(svg, state.scenario.layers, activeLayers, pos);
    });
    layersEl.appendChild(btn);
  }
}
```

In the tick handler, after positions are resolved, add:

```javascript
    drawLayers(svg, state.scenario.layers, activeLayers, pos);
```

In `selectScenario`, clear and re-render layer chips:

```javascript
  activeLayers.clear();
  renderLayerChips();
```

- [ ] **Step 3: Beef up `_demo.json` with sample layers**

Replace the `"layers": {}` in `scenarios/_demo.json` with:

```json
  "layers": {
    "press_triggers": [
      { "from": "7", "to_ball": true, "label": "Триггер" }
    ],
    "lanes": [
      { "from": "5", "to": "7" }
    ],
    "covering": [
      { "from": "2", "to": "3" }
    ]
  }
```

- [ ] **Step 4: Reload and verify**

Expected: three layer chips appear ("Триггеры прессинга", "Линии паса", "Опека"). Tapping each toggles a colored line on the pitch — red for trigger, dashed yellow for lane, dashed blue for cover. Lines update positions as the animation plays.

- [ ] **Step 5: Commit**

```bash
git add pitch.js app.js scenarios/_demo.json
git commit -m "Layer rendering: press triggers, passing lanes, covering — togglable"
```

---

## Tasks 14–21: Author the 8 real scenarios

Each task is identical in shape: create a JSON file under `scenarios/`, add an entry to `scenarios/index.json`, reload the page, click through the scenario, sanity-check movement.

All eight share these conventions:
- Coordinates in 0..100; our goal at y≈0, opponent's goal at y≈100.
- Players keys `"1"`–`"7"` always present in `initial.players`.
- 3–5 keyframes per scenario; `t` strictly increasing 0..1.
- `duration_ms` between 4000 and 6000.
- All player and ball positions inside [5, 95] (margins for visual clarity).
- Title and notes in Russian.

### Task 14: shape-low-block

**Files:**
- Create: `scenarios/shape-low-block.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/shape-low-block.json`**

```json
{
  "id": "shape-low-block",
  "category": "shape",
  "title": "Низкий блок",
  "subtitle": "Соперник у нашей штрафной — все стягиваемся",
  "duration_ms": 5000,
  "ball_side": "opponent",
  "initial": {
    "ball": { "x": 50, "y": 65 },
    "players": {
      "1": { "x": 50, "y": 8 },
      "2": { "x": 35, "y": 30 },
      "3": { "x": 65, "y": 30 },
      "6": { "x": 25, "y": 55 },
      "5": { "x": 50, "y": 55 },
      "4": { "x": 75, "y": 55 },
      "7": { "x": 50, "y": 75 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Соперник владеет мячом у нашей трети" },
    {
      "t": 0.4,
      "note": "Мяч приближается — все трое полузащитников опускаются к защитникам",
      "ball": { "x": 50, "y": 40 },
      "players": {
        "6": { "x": 25, "y": 35, "highlight": true },
        "5": { "x": 50, "y": 33, "highlight": true },
        "4": { "x": 75, "y": 35, "highlight": true }
      }
    },
    {
      "t": 0.8,
      "note": "Получается 5 в линию перед Егором. Сережа держится высоко на отскок",
      "ball": { "x": 45, "y": 28 },
      "players": {
        "2": { "x": 38, "y": 22 },
        "3": { "x": 62, "y": 22 },
        "7": { "x": 50, "y": 60 }
      }
    },
    { "t": 1, "note": "Соперник не может пройти — отбираем" }
  ],
  "layers": {
    "covering": [
      { "from": "6", "to": "2", "label": "Помощь слева" },
      { "from": "4", "to": "3", "label": "Помощь справа" }
    ]
  },
  "roles": {
    "1": "Командуй линией: следи чтобы Леша и Дима стояли на одной высоте",
    "2": "Не выпрыгивай — держи глубину, прикрывай за спиной",
    "3": "Зеркалишь Лешу. Не оставляй свободного игрока между линиями",
    "6": "Опускайся к Леше. Не бойся, что фланг 'открыт' — фланг там, где мяч",
    "5": "Главная задача — закрыть центральный пас. Без тебя они проходят через середину",
    "4": "Опускайся к Диме. Зеркалишь Максима",
    "7": "Держись высоко. Когда отберём — у тебя будет передача и можно бежать"
  }
}
```

- [ ] **Step 2: Add entry to `scenarios/index.json`**

Replace the existing `"scenarios": [...]` array with:

```json
  "scenarios": [
    { "id": "shape-low-block", "file": "shape-low-block.json", "category": "shape" }
  ]
```

(Remove the `_demo` entry — its file can stay in the folder but is no longer referenced.)

- [ ] **Step 3: Reload and verify**

Expected: scenario plays, three mids drop down at t=0.4 (highlighted), defenders pinch at t=0.8. Trails show the collective drop. Roles tooltip works on each player. Covering layer shows blue lines between mid-back pairs.

- [ ] **Step 4: Commit**

```bash
git add scenarios/shape-low-block.json scenarios/index.json
git commit -m "Scenario: shape-low-block — three mids drop next to defenders"
```

### Task 15: shape-ball-on-flank

**Files:**
- Create: `scenarios/shape-ball-on-flank.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/shape-ball-on-flank.json`**

```json
{
  "id": "shape-ball-on-flank",
  "category": "shape",
  "title": "Мяч на фланге",
  "subtitle": "Сдвиг всей команды к мячу, дальний полузащитник смещается в центр",
  "duration_ms": 5000,
  "ball_side": "opponent",
  "initial": {
    "ball": { "x": 50, "y": 50 },
    "players": {
      "1": { "x": 50, "y": 8 },
      "2": { "x": 35, "y": 32 },
      "3": { "x": 65, "y": 32 },
      "6": { "x": 22, "y": 52 },
      "5": { "x": 50, "y": 52 },
      "4": { "x": 78, "y": 52 },
      "7": { "x": 50, "y": 75 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Мяч в центре, исходная позиция" },
    {
      "t": 0.35,
      "note": "Мяч ушёл на их правый фланг (наш левый) — Максим встречает",
      "ball": { "x": 18, "y": 55 },
      "players": {
        "6": { "x": 22, "y": 45, "highlight": true }
      }
    },
    {
      "t": 0.7,
      "note": "Леша подстраховывает за Максимом. Дима сдвигается в центр",
      "players": {
        "2": { "x": 28, "y": 35 },
        "3": { "x": 50, "y": 32, "highlight": true }
      }
    },
    {
      "t": 0.95,
      "note": "ВАЖНО: Мася НЕ остаётся справа — уходит ближе к центру, страхует",
      "players": {
        "4": { "x": 60, "y": 45, "highlight": true },
        "5": { "x": 40, "y": 45 }
      }
    },
    { "t": 1, "note": "Дальний фланг открыт, но они не успеют переключить" }
  ],
  "layers": {
    "covering": [
      { "from": "2", "to": "6", "label": "Страховка" },
      { "from": "3", "to": "5", "label": "Центр" }
    ]
  },
  "roles": {
    "6": "Встречай со стороны центра — не дай ему сыграть в середину",
    "2": "Страхуй Максима за спиной. Не выпрыгивай вторым",
    "3": "Сдвигайся в центр, ты теперь как центральный защитник",
    "5": "Поджимай к мячу, помогай Максиму прессинговать",
    "4": "Самое неинтуитивное: брось свой фланг. Дальний угол они не используют",
    "7": "Возвращайся ниже, прикрывай возможный длинный пас на их фланговика"
  }
}
```

- [ ] **Step 2: Add entry to `scenarios/index.json`** — append to the scenarios array:

```json
    { "id": "shape-ball-on-flank", "file": "shape-ball-on-flank.json", "category": "shape" }
```

- [ ] **Step 3: Reload and verify**

Expected: ball moves to left flank, team shifts, Мася visibly comes inside. Highlight on the right players moving.

- [ ] **Step 4: Commit**

```bash
git add scenarios/shape-ball-on-flank.json scenarios/index.json
git commit -m "Scenario: shape-ball-on-flank — full team shift, far-side tucks inside"
```

### Task 16: build-gk-short

**Files:**
- Create: `scenarios/build-gk-short.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/build-gk-short.json`**

```json
{
  "id": "build-gk-short",
  "category": "build",
  "title": "Розыгрыш от Егора",
  "subtitle": "Защитники расщепляются, Ашот опускается между ними",
  "duration_ms": 5000,
  "ball_side": "ours",
  "initial": {
    "ball": { "x": 50, "y": 8 },
    "players": {
      "1": { "x": 50, "y": 8 },
      "2": { "x": 35, "y": 22 },
      "3": { "x": 65, "y": 22 },
      "6": { "x": 25, "y": 45 },
      "5": { "x": 50, "y": 45 },
      "4": { "x": 75, "y": 45 },
      "7": { "x": 50, "y": 75 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Мяч у Егора. Все на исходных — слишком близко друг к другу" },
    {
      "t": 0.4,
      "note": "Леша и Дима расходятся широко, Ашот опускается между ними — временный 3-в-линию",
      "players": {
        "2": { "x": 20, "y": 22, "highlight": true },
        "3": { "x": 80, "y": 22, "highlight": true },
        "5": { "x": 50, "y": 25, "highlight": true }
      }
    },
    {
      "t": 0.75,
      "note": "Максим и Мася поднимаются выше и шире, чтобы растянуть их прессинг",
      "players": {
        "6": { "x": 15, "y": 55 },
        "4": { "x": 85, "y": 55 }
      }
    },
    {
      "t": 0.95,
      "note": "Егор передаёт Ашоту в опорную зону — у них нет давления на этого игрока",
      "ball": { "x": 50, "y": 25 }
    },
    { "t": 1, "note": "Розыгрыш получен — выходим в среднюю треть" }
  ],
  "layers": {
    "lanes": [
      { "from": "1", "to": "2", "label": "Короткий" },
      { "from": "1", "to": "3", "label": "Короткий" },
      { "from": "1", "to": "5", "label": "В опорную" }
    ]
  },
  "roles": {
    "1": "Не паникуй. Не выноси. Спокойно выбирай: Леша, Дима, или Ашот в центре",
    "2": "Уйди ОЧЕНЬ широко, почти на бровку. Дай угол для паса",
    "3": "Зеркаль Лешу. Открывайся, не стой за соперником",
    "5": "Опустись между Лешей и Димой — стань третьим защитником. Так у нас 3 в линию против их 2",
    "6": "Поднимись высоко и широко. Твоя задача — растянуть их крайнего полузащитника",
    "4": "Зеркаль Максима",
    "7": "Заякорь их центральных защитников — не давай им подняться выше"
  }
}
```

- [ ] **Step 2: Add entry to `scenarios/index.json`**

```json
    { "id": "build-gk-short", "file": "build-gk-short.json", "category": "build" }
```

- [ ] **Step 3: Reload, click through, verify Ашот drops between defenders**

- [ ] **Step 4: Commit**

```bash
git add scenarios/build-gk-short.json scenarios/index.json
git commit -m "Scenario: build-gk-short — defenders split, central mid drops between"
```

### Task 17: build-break-press

**Files:**
- Create: `scenarios/build-break-press.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/build-break-press.json`**

```json
{
  "id": "build-break-press",
  "category": "build",
  "title": "Выход из-под прессинга",
  "subtitle": "Возврат на Егора и переключение на свободный фланг",
  "duration_ms": 5500,
  "ball_side": "ours",
  "initial": {
    "ball": { "x": 70, "y": 25 },
    "players": {
      "1": { "x": 50, "y": 8 },
      "2": { "x": 25, "y": 22 },
      "3": { "x": 75, "y": 25 },
      "6": { "x": 20, "y": 50 },
      "5": { "x": 50, "y": 30 },
      "4": { "x": 80, "y": 50 },
      "7": { "x": 50, "y": 70 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Дима с мячом справа, на него идёт прессинг" },
    {
      "t": 0.3,
      "note": "Все варианты вперёд закрыты. Дима возвращает Егору — это НЕ ошибка",
      "ball": { "x": 50, "y": 10 },
      "players": {
        "3": { "x": 70, "y": 28, "highlight": true }
      }
    },
    {
      "t": 0.6,
      "note": "Левый фланг свободен — Леша уже шире и ждёт",
      "players": {
        "2": { "x": 15, "y": 25, "highlight": true }
      }
    },
    {
      "t": 0.85,
      "note": "Егор переводит по диагонали налево",
      "ball": { "x": 15, "y": 25 }
    },
    {
      "t": 1,
      "note": "Леша получил мяч в свободной зоне — Максим уже на фланге, атака продолжается",
      "players": {
        "6": { "x": 25, "y": 55 }
      }
    }
  ],
  "layers": {
    "lanes": [
      { "from": "1", "to": "2", "label": "Перевод" }
    ]
  },
  "roles": {
    "1": "Ты 7-й полевой. Не выноси длинным — переведи на свободного защитника",
    "2": "Когда мяч у Димы под прессингом — расширяйся, готовься получить",
    "3": "Под прессингом смело отдавай назад вратарю. Это не отступление",
    "5": "Покажись в опорную, чтобы Егор имел третий вариант",
    "6": "Поднимайся когда видишь, что Леша получает с переводом",
    "4": "Симметрично — на тот случай, если бы прессинг шёл на Лешу",
    "7": "Заякорь их защитников. Если они побегут на Егора — открой им длинный пас за спину"
  }
}
```

- [ ] **Step 2: Add to manifest**

```json
    { "id": "build-break-press", "file": "build-break-press.json", "category": "build" }
```

- [ ] **Step 3: Reload, verify ball goes Дима → Егор → Леша across the field**

- [ ] **Step 4: Commit**

```bash
git add scenarios/build-break-press.json scenarios/index.json
git commit -m "Scenario: build-break-press — return to GK then switch diagonally"
```

### Task 18: press-high-trigger

**Files:**
- Create: `scenarios/press-high-trigger.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/press-high-trigger.json`**

```json
{
  "id": "press-high-trigger",
  "category": "press",
  "title": "Высокий прессинг по триггеру",
  "subtitle": "Их вратарь получает мяч — Сережа давит, остальные смещаются",
  "duration_ms": 5000,
  "ball_side": "opponent",
  "initial": {
    "ball": { "x": 50, "y": 88 },
    "players": {
      "1": { "x": 50, "y": 12 },
      "2": { "x": 30, "y": 35 },
      "3": { "x": 70, "y": 35 },
      "6": { "x": 22, "y": 55 },
      "5": { "x": 50, "y": 55 },
      "4": { "x": 78, "y": 55 },
      "7": { "x": 50, "y": 72 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Их защитник отдал назад вратарю — это триггер прессинга" },
    {
      "t": 0.35,
      "note": "Сережа бежит дугой к вратарю — закрывает пас на одного защитника",
      "players": {
        "7": { "x": 45, "y": 85, "highlight": true }
      }
    },
    {
      "t": 0.6,
      "note": "Ашот шагает на их опорника. Максим и Мася закрывают крайних защитников",
      "players": {
        "5": { "x": 50, "y": 68, "highlight": true },
        "6": { "x": 28, "y": 60 },
        "4": { "x": 72, "y": 60 }
      }
    },
    {
      "t": 0.85,
      "note": "Леша и Дима поднимают линию до центра — обрезаем длинный пас",
      "players": {
        "2": { "x": 32, "y": 48 },
        "3": { "x": 68, "y": 48 }
      }
    },
    {
      "t": 1,
      "note": "Вратарь под давлением. Длинный наугад — Леша или Дима подбирают",
      "ball": { "x": 40, "y": 50 }
    }
  ],
  "layers": {
    "press_triggers": [
      { "from": "7", "to_ball": true, "label": "Триггер" }
    ],
    "covering": [
      { "from": "5", "to": "7", "label": "За Сережей" }
    ]
  },
  "roles": {
    "1": "Будь готов выйти из ворот — линия высокая, длинный пас за спину твоя зона",
    "2": "Поднимай линию вместе с Димой. Не оставайся низко — иначе разрыв",
    "3": "Зеркаль Лешу",
    "6": "Шагай на их крайнего защитника. Не давай ему развернуться",
    "5": "Закрой их опорника. Это самый важный игрок — без него они не разыграют",
    "4": "Зеркаль Максима",
    "7": "Беги ДУГОЙ — заходи так, чтобы вратарь видел только один вариант паса"
  }
}
```

- [ ] **Step 2: Add to manifest**

```json
    { "id": "press-high-trigger", "file": "press-high-trigger.json", "category": "press" }
```

- [ ] **Step 3: Reload, verify Сережа goes high, mids step up, defenders push line up**

- [ ] **Step 4: Commit**

```bash
git add scenarios/press-high-trigger.json scenarios/index.json
git commit -m "Scenario: press-high-trigger — forward curves to GK, full team steps up"
```

### Task 19: press-mid-block

**Files:**
- Create: `scenarios/press-mid-block.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/press-mid-block.json`**

```json
{
  "id": "press-mid-block",
  "category": "press",
  "title": "Средний блок",
  "subtitle": "Не лезем высоко — ждём, выдавливаем на фланг",
  "duration_ms": 5000,
  "ball_side": "opponent",
  "initial": {
    "ball": { "x": 50, "y": 80 },
    "players": {
      "1": { "x": 50, "y": 10 },
      "2": { "x": 32, "y": 35 },
      "3": { "x": 68, "y": 35 },
      "6": { "x": 25, "y": 55 },
      "5": { "x": 50, "y": 55 },
      "4": { "x": 75, "y": 55 },
      "7": { "x": 50, "y": 65 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Их защитник с мячом — мы не лезем, держим строй в середине" },
    {
      "t": 0.35,
      "note": "Они продвигаются в центре — Сережа просто закрывает пас вперёд, не прессингует",
      "ball": { "x": 50, "y": 70 },
      "players": {
        "7": { "x": 50, "y": 68 }
      }
    },
    {
      "t": 0.65,
      "note": "Они переводят на правый фланг — это наш триггер на прессинг",
      "ball": { "x": 80, "y": 65 },
      "players": {
        "4": { "x": 72, "y": 55, "highlight": true }
      }
    },
    {
      "t": 0.85,
      "note": "Мася прессингует, Дима поджимает, Ашот закрывает центр",
      "players": {
        "4": { "x": 78, "y": 62, "highlight": true },
        "3": { "x": 65, "y": 50 },
        "5": { "x": 55, "y": 55, "highlight": true }
      }
    },
    {
      "t": 1,
      "note": "У них нет вариантов — фланговик в тупике у бровки",
      "ball": { "x": 85, "y": 60 }
    }
  ],
  "layers": {
    "press_triggers": [
      { "from": "4", "to_ball": true, "label": "Триггер: мяч на фланге" }
    ],
    "covering": [
      { "from": "3", "to": "4", "label": "Подстраховка" }
    ]
  },
  "roles": {
    "1": "Спокойно. Это средний блок, не высокий — длинный за спину менее опасен",
    "2": "Держи линию. Не выпрыгивай на их центрального — у нас триггер на фланг",
    "3": "При прессинге Маси — иди следом, страхуй за спиной",
    "6": "Зеркаль Масю если триггер с другой стороны",
    "5": "Главное правило: всегда между мячом и нашими воротами. Не зевай переключение",
    "4": "При мяче на твоей бровке — пошёл прессинговать. До того момента — стой в строю",
    "7": "Не беги на их защитников. Просто закрывай центральный пас в опорника"
  }
}
```

- [ ] **Step 2: Add to manifest**

```json
    { "id": "press-mid-block", "file": "press-mid-block.json", "category": "press" }
```

- [ ] **Step 3: Reload, verify the team stays put until ball goes wide, then collapses on flank**

- [ ] **Step 4: Commit**

```bash
git add scenarios/press-mid-block.json scenarios/index.json
git commit -m "Scenario: press-mid-block — compact, press only triggered on flank ball"
```

### Task 20: attack-overlap-right

**Files:**
- Create: `scenarios/attack-overlap-right.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/attack-overlap-right.json`**

```json
{
  "id": "attack-overlap-right",
  "category": "attack",
  "title": "Подключение по правому флангу",
  "subtitle": "Мася с мячом, Дима в забеге, Сережа уводит защитника",
  "duration_ms": 5500,
  "ball_side": "ours",
  "initial": {
    "ball": { "x": 75, "y": 60 },
    "players": {
      "1": { "x": 50, "y": 10 },
      "2": { "x": 35, "y": 45 },
      "3": { "x": 65, "y": 45 },
      "6": { "x": 30, "y": 60 },
      "5": { "x": 50, "y": 65 },
      "4": { "x": 75, "y": 60 },
      "7": { "x": 55, "y": 78 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Мася получил мяч у бровки, перед ним их защитник" },
    {
      "t": 0.3,
      "note": "Дима стартует в забег ИЗ ЗАЩИТЫ по флангу — снаружи Маси",
      "players": {
        "3": { "x": 85, "y": 60, "highlight": true }
      }
    },
    {
      "t": 0.55,
      "note": "Сережа уводит центрального защитника на дальнюю штангу — открывает пространство",
      "players": {
        "7": { "x": 35, "y": 85, "highlight": true }
      }
    },
    {
      "t": 0.8,
      "note": "Мася отдаёт Диме в забег за спину защитнику",
      "ball": { "x": 88, "y": 75 },
      "players": {
        "3": { "x": 88, "y": 78 }
      }
    },
    {
      "t": 0.95,
      "note": "Ашот врывается на дальнюю — на возможный навес",
      "players": {
        "5": { "x": 60, "y": 82, "highlight": true }
      }
    },
    { "t": 1, "note": "Дима подаёт. Сережа на ближней, Ашот на дальней" }
  ],
  "layers": {
    "lanes": [
      { "from": "4", "to": "3", "label": "Пас в забег" },
      { "from": "3", "to": "5", "label": "Навес" }
    ]
  },
  "roles": {
    "1": "Подстраховка сзади. Если контратака — стой ближе к Леше",
    "2": "Один в линию защиты. Если мы потеряем — ты единственный сзади",
    "3": "Не бойся бежать ВПЕРЁД из защиты. Соперник тебя не ждёт",
    "6": "Балансируй. Опускайся ниже, прикрывай за Димой если он убежал",
    "5": "Дождись момента и врывайся на дальнюю штангу с разбегу",
    "4": "Жди подключения Димы — отдай ему в открытое пространство, не пытайся обыграть сам",
    "7": "Твоя задача — увести защитника от ворот. Беги к дальней штанге чтобы освободить ближнюю"
  }
}
```

- [ ] **Step 2: Add to manifest**

```json
    { "id": "attack-overlap-right", "file": "attack-overlap-right.json", "category": "attack" }
```

- [ ] **Step 3: Reload, verify Дима overlaps and ball ends up wide-deep**

- [ ] **Step 4: Commit**

```bash
git add scenarios/attack-overlap-right.json scenarios/index.json
git commit -m "Scenario: attack-overlap-right — defender overlaps, forward drags CB"
```

### Task 21: attack-switch-play

**Files:**
- Create: `scenarios/attack-switch-play.json`
- Modify: `scenarios/index.json`

- [ ] **Step 1: Create `scenarios/attack-switch-play.json`**

```json
{
  "id": "attack-switch-play",
  "category": "attack",
  "title": "Смена фланга",
  "subtitle": "Розыгрыш слева перетягивает соперника — быстрый перевод направо",
  "duration_ms": 5500,
  "ball_side": "ours",
  "initial": {
    "ball": { "x": 25, "y": 55 },
    "players": {
      "1": { "x": 50, "y": 10 },
      "2": { "x": 28, "y": 40 },
      "3": { "x": 65, "y": 35 },
      "6": { "x": 22, "y": 55 },
      "5": { "x": 50, "y": 55 },
      "4": { "x": 80, "y": 55 },
      "7": { "x": 55, "y": 75 }
    }
  },
  "keyframes": [
    { "t": 0, "note": "Максим с мячом слева, мы давим в их левый угол" },
    {
      "t": 0.3,
      "note": "Соперник сместился к мячу — справа у Маси 1в1 с фланговиком",
      "ball": { "x": 28, "y": 60 }
    },
    {
      "t": 0.55,
      "note": "Максим отдаёт коротко на Ашота в центр — Ашот первым касанием готовится",
      "ball": { "x": 45, "y": 50 },
      "players": {
        "5": { "x": 45, "y": 50, "highlight": true }
      }
    },
    {
      "t": 0.8,
      "note": "Ашот переводит по диагонали на Масю — соперник не успевает сместиться",
      "ball": { "x": 80, "y": 55 },
      "players": {
        "4": { "x": 82, "y": 60, "highlight": true }
      }
    },
    {
      "t": 0.95,
      "note": "Мася открыт. Дима подключается из глубины — 2 на 1 на правом фланге",
      "players": {
        "3": { "x": 70, "y": 60, "highlight": true }
      }
    },
    { "t": 1, "note": "Атака в развитии — слабая сторона стала сильной" }
  ],
  "layers": {
    "lanes": [
      { "from": "6", "to": "5", "label": "Короткий" },
      { "from": "5", "to": "4", "label": "Перевод" }
    ]
  },
  "roles": {
    "1": "Низко. Не подыгрывай — это атакующая ситуация, твой выход не нужен",
    "2": "Прикрывай за Максимом",
    "3": "Когда мяч пойдёт на Масю — ВРЫВАЙСЯ из глубины. У вас будет 2 на 1",
    "6": "Не зацикливайся на левом фланге. Отдай Ашоту и сразу делай движение в штрафную",
    "5": "Главный диспетчер. Получи поудобнее, открой корпус, переведи на дальнюю",
    "4": "Жди мяч на своей половине поля. Не уходи ниже — там Дима",
    "7": "Двигайся между их защитниками. Создавай для Маси и Димы свободную зону"
  }
}
```

- [ ] **Step 2: Add to manifest**

```json
    { "id": "attack-switch-play", "file": "attack-switch-play.json", "category": "attack" }
```

- [ ] **Step 3: Reload, verify ball goes left → centre → right wide, with Дима overlapping**

- [ ] **Step 4: Commit**

```bash
git add scenarios/attack-switch-play.json scenarios/index.json
git commit -m "Scenario: attack-switch-play — left build draws over, switch to weak side 2v1"
```

---

## Task 22: Per-category second-scenario picker

By the end of Task 21 the manifest has 8 scenarios across 4 categories. But Task 7 wired `selectCategory` to auto-pick only the *first* scenario in a category. Make a small picker so the viewer can choose either scenario within a category.

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Render a second-tier scenario list inside each category**

Replace the `selectCategory` function:

```javascript
async function selectCategory(catId) {
  state.selectedCategory = catId;
  renderChips();
  renderScenarioList();
  const inCat = state.manifest.scenarios.filter(s => s.category === catId);
  if (inCat.length > 0) await selectScenario(inCat[0].id);
}

function renderScenarioList() {
  let list = document.getElementById('scenario-list');
  if (!list) {
    list = document.createElement('nav');
    list.id = 'scenario-list';
    list.className = 'chips';
    list.setAttribute('aria-label', 'Сценарии в категории');
    chipsEl.after(list);
  }
  list.innerHTML = '';
  const inCat = state.manifest.scenarios.filter(s => s.category === state.selectedCategory);
  for (const s of inCat) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = s.id.replace(/^[a-z]+-/, '').replace(/-/g, ' ');
    btn.setAttribute('aria-pressed', state.scenario?.id === s.id ? 'true' : 'false');
    btn.addEventListener('click', async () => {
      await selectScenario(s.id);
      renderScenarioList(); // refresh aria-pressed
    });
    list.appendChild(btn);
  }
}
```

- [ ] **Step 2: Reload and verify**

Expected: under the category chips, a second row of chips shows the scenarios in the current category. Selecting one updates the pitch.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "Add per-category scenario list as second chip row"
```

---

## Task 23: Final polish — favicon, meta tags, mobile QA

**Files:**
- Create: `assets/favicon.svg`
- Modify: `index.html`

- [ ] **Step 1: Create a simple favicon**

`assets/favicon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#2d8a3e"/>
  <circle cx="32" cy="32" r="14" fill="#fff"/>
  <text x="32" y="40" text-anchor="middle" font-size="22" font-weight="700" fill="#000" font-family="system-ui">7</text>
</svg>
```

- [ ] **Step 2: Add meta tags + favicon link**

In `index.html`, add inside `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<meta name="description" content="Тактическая схема Pivo 7×7: позиции и движения в атаке и обороне">
<meta property="og:title" content="Pivo · Тактика 7×7">
<meta property="og:description" content="Сценарии прессинга, обороны, розыгрыша и атак">
<meta property="og:type" content="website">
```

- [ ] **Step 3: Manual QA on a phone (or DevTools mobile emulation)**

Open Safari/Chrome DevTools, switch to mobile (iPhone 13). Verify:
- Page fits viewport without horizontal scroll
- All 4 category chips are reachable (horizontal scroll on the chip row if needed)
- Pitch renders inside the rounded green container
- Play button is tap-friendly (≥36 px hit area)
- Scrubber thumb is draggable with finger
- Player tap shows tooltip and tooltip does not get cut off at right edge of pitch
- Caption text wraps cleanly for multi-line notes
- Performance: animation is smooth (no visible frame drops) on a real device

Fix any issues found (typical: tooltip clamping, chip overflow shadows, font-size readability).

- [ ] **Step 4: Commit**

```bash
git add index.html assets/favicon.svg
git commit -m "Favicon, OG meta, mobile QA fixes"
```

---

## Task 24: Deployment — GitHub Pages

**Files:**
- Create: `.github/workflows/pages.yml`

This task assumes the repo will be pushed to GitHub. If there's no remote yet, the user runs `gh repo create` first.

- [ ] **Step 1: Create `.github/workflows/pages.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: User pushes to GitHub and enables Pages**

User runs:
```bash
gh repo create football7 --public --source=. --remote=origin --push
```
Then in the GitHub repo Settings → Pages, set Source to "GitHub Actions". The workflow will deploy on next push.

- [ ] **Step 3: Verify deployment**

Visit the URL printed by the workflow. Confirm the page loads, scenarios play, and the URL is shareable to a phone.

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/pages.yml
git commit -m "GitHub Pages deployment via Actions"
git push
```

---

## Done

After Task 24, the site is live and shareable. Future-you can add a 9th scenario by:
1. Creating `scenarios/<new-id>.json` with the same schema.
2. Adding the entry to `scenarios/index.json`.
3. Pushing — the workflow redeploys.
