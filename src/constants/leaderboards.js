import { COMPARE_MODES_BY_KEY, stat } from './compare.js';

// ---------------------------------------------------------------------------
// Leaderboards: todas usam a mesma base (comando, busca e imagem); cada jogo só
// define o título, as colunas e os modos. Para adicionar um jogo, é só incluir
// uma entrada em GAMES (o Discord limita um comando a 25 subcomandos).
// ---------------------------------------------------------------------------

export const LEADERBOARD_TYPES = [
  { key: 'general', label: 'Geral', suffix: '', param: null },
  { key: 'monthly', label: 'Mensal', suffix: 'monthly', param: 'monthly' },
  { key: 'weekly', label: 'Semanal', suffix: 'weekly', param: 'weekly' },
  { key: 'daily', label: 'Diário', suffix: 'daily', param: 'daily' },
];

const SINGLE_MODE = [{ key: 'general', label: 'Geral', prefix: null }];

// Bed Wars (opções do select: Geral, Champions, Solo, Duplas, Trios, Quartetos, 1v1, 2v2,
// 3v3, 4v4, 4s, Pilares, ...). `prefix` = prefixo das chaves na API.
const BEDWARS_MODES = [
  { key: 'general', label: 'Geral', prefix: '' },
  { key: 'champions', label: 'Champions', prefix: 'champions' },
  { key: 'solo', label: 'Solo', prefix: 'solo' },
  { key: 'doubles', label: 'Duplas', prefix: 'doubles' },
  { key: 'trios', label: 'Trios', prefix: '3v3v3v3' },
  { key: 'quartetos', label: 'Quartetos', prefix: '4v4v4v4' },
  { key: '1v1', label: '1v1', prefix: '1v1' },
  { key: '2v2', label: '2v2', prefix: '2v2' },
  { key: '3v3', label: '3v3', prefix: '3v3' },
  { key: '4v4', label: '4v4', prefix: '4v4' },
  { key: '4s', label: '4s', prefix: '4v4v4v4' },
  { key: 'pilares', label: 'Pilares', prefix: 'pillars' },
];

// Jogos que reaproveitam título/campos do /comparar: [subcomando, chave no /comparar]
const FROM_COMPARE = [
  ['sopa', 'duels_sopa'],
  ['bedfight', 'duels_bedfight'],
  ['boxing', 'duels_boxing'],
  ['bridge', 'bridge'],
  ['buildbattle', 'buildbattle'],
  ['ctf', 'ctf'],
  ['skywars', 'skywars'],
  ['hungergames', 'hungergames'],
  ['minimush', 'minimush'],
  ['party', 'party'],
  ['murder', 'murder'],
  ['quickbuilders', 'quickbuilders'],
  ['hideandseek', 'hideandseek'],
  ['gladiator', 'duels_gladiator'],
  ['nodebuff', 'duels_nodebuff'],
  ['uhc', 'duels_uhc'],
  ['combo', 'duels_combo'],
  ['gapple', 'duels_gapple'],
  ['sumo', 'duels_sumo'],
  ['fireball', 'duels_fireball'],
  ['hgsimulator', 'duels_hgsimulator'],
  ['pearl', 'duels_pearl'],
  ['bedrush', 'duels_bedrush'],
];

const bedwars = {
  key: 'bedwars',
  endpoint: 'bedwars',
  label: 'Bed Wars',
  title: [
    { text: 'BED', color: '#ff1616' },
    { text: 'WARS', color: '#ffffff' },
  ],
  source: { stats: ['bedwars'] },
  modes: BEDWARS_MODES,
  showLevel: true,
  columns: [
    stat('Vitórias', 'wins'),
    stat('Abates', 'kills'),
    stat('Abates F.', 'final_kills'),
    stat('Camas Q.', 'beds_broken'),
  ],
};

const arena = {
  key: 'arena',
  endpoint: 'arena',
  label: 'PvP: Arena',
  title: [
    { text: 'PVP:', color: '#ffffff' },
    { text: 'ARENA', color: '#ff9f43' },
  ],
  source: { stats: ['arena', 'pvp_arena', 'pvp'] },
  modes: SINGLE_MODE,
  showLevel: false,
  columns: [stat('Abates', 'kills'), stat('Mortes', 'deaths'), stat('Winstreak', 'winstreak')],
};

const derived = FROM_COMPARE.map(([key, compareKey]) => {
  const mode = COMPARE_MODES_BY_KEY.get(compareKey);

  return {
    key,
    endpoint: key,
    label: mode.label,
    title: mode.title,
    source: mode.source,
    modes: SINGLE_MODE,
    showLevel: false,
    columns: mode.fields.filter((field) => field.label !== 'Nível').slice(0, 4),
  };
});

export const LEADERBOARD_GAMES = [bedwars, arena, ...derived];
export const LEADERBOARD_GAMES_BY_KEY = new Map(LEADERBOARD_GAMES.map((game) => [game.key, game]));
