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
