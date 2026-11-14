import { ratio, stat } from './compare.js';

// ---------------------------------------------------------------------------
// Leaderboards
//
// A API devolve os registros "achatados" no formato `<grupo>:<campo>`
// (ex.: `bedwars:wins`, `duels:soup_wins`). Só entram aqui os endpoints que
// realmente respondem; modos/períodos não são suportados pela API.
// ---------------------------------------------------------------------------
const title = (...segments) =>
  segments.map(([text, color, join = false]) => ({ text, color, join }));

export const LEADERBOARD_GAMES = [
  {
    key: 'bedwars',
    endpoint: 'bedwars',
    label: 'Bed Wars',
    source: ['bedwars'],
    showLevel: true,
    title: title(['BED', '#ff1616'], ['WARS', '#ffffff']),
    columns: [
      stat('Nível', 'level'),
      stat('Vitórias', 'wins'),
      stat('Abates', 'kills'),
      stat('Abates F.', 'final_kills'),
    ],
  },
  {
    key: 'skywars',
    endpoint: 'skywars',
    label: 'Sky Wars',
    source: ['skywars_r1'],
    showLevel: true,
    title: title(['SKY', '#ffffff'], ['WARS', '#ffc000']),
    columns: [
      stat('Nível', 'level'),
      stat('Vitórias', 'wins'),
      stat('Abates', 'kills'),
      stat('Derrotas', 'losses'),
    ],
  },
  {
    key: 'ctf',
    endpoint: 'ctf',
    label: 'CTF',
    source: ['ctf'],
    title: title(['C', '#2007fa'], ['T', '#ffffff', true], ['F', '#ff1616', true]),
    columns: [stat('Capturas', 'captures'), stat('Abates', 'kills'), stat('Coins', 'coins')],
  },
  {
    key: 'party',
    endpoint: 'party',
    label: 'Party',
    source: ['party'],
    title: title(['PARTY', '#f88582']),
    columns: [
      stat('Pontos', 'points'),
      stat('1° Lugar', 'first_place'),
      stat('2° Lugar', 'second_place'),
      stat('3° Lugar', 'third_place'),
    ],
  },
  {
    key: 'quickbuilders',
    endpoint: 'quickbuilders',
    label: 'Quick Builders',
    source: ['quickbuilders'],
    title: title(['QUICK', '#ffffff'], ['BUILDERS', '#67deff']),
    columns: [
      stat('Vitórias', 'wins'),
      stat('Derrotas', 'losses'),
      stat('Constr. P', 'perfect_builds'),
      stat('Builds', 'builds'),
    ],
  },
  {
    key: 'murder',
    endpoint: 'murder',
    label: 'Murder',
    source: ['murder'],
    title: title(['MURDER', '#ff1616']),
    columns: [stat('Vitórias', 'wins'), stat('Derrotas', 'losses')],
  },
  {
    key: 'hungergames',
    endpoint: 'hg',
    label: 'Hunger Games',
    source: ['hungergames'],
    title: title(['HUNGER', '#ffc000'], ['GAMES', '#ffffff']),
    columns: [
      stat('Vitórias', 'wins'),
      stat('Abates', 'kills'),
      stat('Mortes', 'deaths'),
      ratio('KDR', 'kills', 'deaths'),
    ],
  },
  {
    key: 'minimush',
    endpoint: 'minimush',
    label: 'Minimush',
    source: ['hungergames'],
    title: title(['MINIMUSH', '#ffc000']),
    columns: [
      stat('Vitórias', 'mode_minimush_wins'),
      stat('Abates', 'mode_minimush_kills'),
      stat('Mortes', 'mode_minimush_deaths'),
    ],
  },
  {
    key: 'arena',
    endpoint: 'pvp',
    label: 'PvP: Arena',
    source: ['pvp'],
    title: title(['PVP:', '#ffffff'], ['ARENA', '#ff9f43']),
    columns: [
      stat('Abates', 'arena_kills'),
      stat('Mortes', 'arena_deaths'),
      ratio('KDR', 'arena_kills', 'arena_deaths'),
    ],
  },
  {
    key: 'sopa',
    endpoint: 'soup',
    label: 'Duels: Sopa',
    source: ['duels'],
    title: title(['SOPA', '#ff9f43']),
    columns: [
      stat('Vitórias', 'soup_wins'),
      stat('Mortes', 'soup_deaths'),
      stat('Winstreak', 'soup_winstreak'),
    ],
  },
  {
    key: 'gladiator',
    endpoint: 'gladiator',
    label: 'Duels: Gladiator',
    source: ['duels'],
    title: title(['GLADIATOR', '#b2bec3']),
    columns: [
      stat('Vitórias', 'gladiator_wins'),
      stat('Mortes', 'gladiator_deaths'),
      stat('Winstreak', 'gladiator_winstreak'),
    ],
  },
  {
    key: 'bridge',
    endpoint: 'bridge',
    label: 'The Bridge',
    source: ['duels'],
    title: title(['THE', '#ff1616'], ['BRIDGE', '#33c2ea']),
    columns: [
      stat('Vitórias', 'bridge_wins'),
      stat('Derrotas', 'bridge_losses'),
      stat('Pontos', 'bridge_points'),
    ],
  },
];

export const LEADERBOARD_GAMES_BY_KEY = new Map(
  LEADERBOARD_GAMES.map((game) => [game.key, game]),
);
