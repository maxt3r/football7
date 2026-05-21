// Pitch coordinate system: scenarios use 0..100 in both x and y.
// SVG coordinate system: 0..PITCH_W wide, 0..PITCH_H tall (pitch is taller than wide).
export const PITCH_W = 100;
export const PITCH_H = 150;

export function pitchToSvg({ x, y }) {
  return { x: x * (PITCH_W / 100), y: y * (PITCH_H / 100) };
}

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
