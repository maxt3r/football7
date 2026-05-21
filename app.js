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
    updateTime();
    if (!state.animator.isPlaying()) updatePlayBtn();
  });
  state.animator.on('keyframe', (e) => {
    if (e.keyframe.note) captionEl.textContent = e.keyframe.note;
  });
  updateTime();
  updatePlayBtn();
}

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
