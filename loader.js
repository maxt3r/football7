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
