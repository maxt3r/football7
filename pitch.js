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
