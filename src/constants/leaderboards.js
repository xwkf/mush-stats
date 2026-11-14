// ---------------------------------------------------------------------------
// Leaderboards
//
// A API devolve os registros "achatados" no formato `<grupo>:<campo>`
// (ex.: `bedwars:wins`, `duels:soup_wins`).
//
// Cada jogo tem uma ou mais variantes (o "modo" do comando) e cada variante
// expõe colunas que também servem como "tipo" de ranking.
// ---------------------------------------------------------------------------
const title = (...segments) =>
  segments.map(([text, color, join = false]) => ({ text, color, join }));

const int = (key, label, field) => ({ key, label, field, format: 'int' });
const badge = (key, label, field = 'level') => ({
  key,
  label,
  field,
  format: 'badge',
  weight: 1.45,
});
const first = (key, label) => ({ key, label, format: 'int', pick: 'first' });
const prefixed = (key, label, prefix) => ({ key, label, format: 'int', pickPrefix: prefix });
const ratio = (key, label, numerator, denominator) => ({
  key,
  label,
  format: 'ratio',
  numerator,
  denominator,
});

const geral = (columns, extra = {}) => ({
  key: 'geral',
  label: 'Geral',
  endpoints: extra.endpoints ?? [],
  columns,
  ...extra,
});

export const LEADERBOARD_GAMES = [
  {
    key: 'bedwars',
    label: 'Bed Wars',
    source: ['bedwars'],
    profile: { stats: ['bedwars'], badge: 'level_badge', level: 'level' },
    title: title(['BED', '#ff1616'], ['WARS', '#ffffff']),
    variants: [
      geral(
        [
          badge('level', 'Nível'),
          int('xp', 'XP', 'xp'),
          int('wins', 'Vitórias', 'wins'),
          int('kills', 'Abates', 'kills'),
          int('final_kills', 'Kills F.', 'final_kills'),
        ],
        { endpoints: ['bedwars'] },
      ),
      {
        key: 'champions',
        label: 'Champions 07/26',
        endpoints: ['bedwarschampions2607', 'bedwarschampions2601'],
        title: title(['BED', '#ff1616'], ['WARS', '#ffffff'], ['CHAMPIONS', '#ffc000']),
        columns: [first('points', 'Pontos')],
      },
    ],
  },
  {
    key: 'skywars',
    label: 'Sky Wars',
    source: ['skywars_r1'],
    profile: { stats: ['skywars_r1', 'skywars'], badge: 'level_badge', level: 'level' },
    title: title(['SKY', '#ffffff'], ['WARS', '#ffc000']),
    variants: [
      geral(
        [
          badge('level', 'Nível'),
          int('xp', 'XP', 'xp'),
          int('wins', 'Vitórias', 'wins'),
          int('kills', 'Abates', 'kills'),
          int('coins', 'Coins', 'coins'),
        ],
        { endpoints: ['skywars'] },
      ),
    ],
  },
  {
    key: 'ctf',
    label: 'CTF',
    source: ['ctf'],
    profile: { stats: ['ctf'] },
    title: title(['C', '#2007fa'], ['T', '#ffffff', true], ['F', '#ff1616', true]),
    variants: [
      geral(
        [
          int('captures', 'Capturas', 'captures'),
          int('kills', 'Abates', 'kills'),
          int('coins', 'Coins', 'coins'),
        ],
        { endpoints: ['ctf'] },
      ),
    ],
  },
  {
    key: 'party',
    label: 'Party',
    source: ['party'],
    profile: { stats: ['party'] },
    title: title(['PARTY', '#f88582']),
    variants: [
      geral(
        [
          int('points', 'Pontos', 'points'),
          int('first_place', '1º Lugar', 'first_place'),
          int('second_place', '2º Lugar', 'second_place'),
          int('third_place', '3º Lugar', 'third_place'),
        ],
        { endpoints: ['party'] },
      ),
    ],
  },
  {
    key: 'quickbuilders',
    label: 'Quick Builders',
    source: ['quickbuilders'],
    profile: { stats: ['quickbuilders'], badge: 'level_badge', level: 'level' },
    title: title(['QUICK', '#ffffff'], ['BUILDERS', '#67deff']),
    variants: [
      geral(
        [
          int('wins', 'Vitórias', 'wins'),
          int('losses', 'Derrotas', 'losses'),
          int('perfect_builds', 'Constr. P', 'perfect_builds'),
          int('builds', 'Builds', 'builds'),
        ],
        { endpoints: ['quickbuilders'] },
      ),
    ],
  },
  {
    key: 'murder',
    label: 'Murder',
    source: ['murder'],
    profile: { stats: ['murder'] },
    title: title(['MURDER', '#ff1616']),
    variants: [
      geral(
        [
          int('wins', 'Vitórias', 'wins'),
          int('losses', 'Derrotas', 'losses'),
        ],
        { endpoints: ['murder'] },
      ),
    ],
  },
  {
    key: 'hungergames',
    label: 'Hunger Games',
    source: ['hungergames'],
    profile: { stats: ['hungergames'] },
    title: title(['HUNGER', '#ffc000'], ['GAMES', '#ffffff']),
    variants: [
      geral(
        [
          first('rank', 'Rank'),
          int('wins', 'Vitórias', 'wins'),
          int('kills', 'Abates', 'kills'),
          int('deaths', 'Mortes', 'deaths'),
          ratio('kdr', 'K/D', 'kills', 'deaths'),
        ],
        { endpoints: ['hg'] },
      ),
    ],
  },
  {
    key: 'minimush',
    label: 'Minimush',
    source: ['hungergames'],
    profile: { stats: ['hungergames'] },
    title: title(['MINIMUSH', '#ffc000']),
    variants: [
      geral(
        [
          first('rank', 'Rank'),
          int('wins', 'Vitórias', 'mode_minimush_wins'),
          int('kills', 'Abates', 'mode_minimush_kills'),
          int('deaths', 'Mortes', 'mode_minimush_deaths'),
        ],
        { endpoints: ['minimush'] },
      ),
    ],
  },
  {
    key: 'arena',
    label: 'PvP: Arena',
    source: ['pvp'],
    profile: { stats: ['pvp'] },
    title: title(['PVP:', '#ffffff'], ['ARENA', '#ff9f43']),
    variants: [
      geral(
        [
          int('kills', 'Abates', 'arena_kills'),
          int('deaths', 'Mortes', 'arena_deaths'),
          ratio('kdr', 'K/D', 'arena_kills', 'arena_deaths'),
        ],
        { endpoints: ['pvp'] },
      ),
    ],
  },
  {
    key: 'sopa',
    label: 'Duels: Sopa',
    source: ['duels'],
    profile: { stats: ['duels'], badge: 'soup_level_badge' },
    title: title(['SOPA', '#ff9f43']),
    variants: [
      geral(
        [
          prefixed('xp', 'XP Mensal', 'soup_exp_'),
          int('wins', 'Vitórias', 'soup_wins'),
          int('deaths', 'Mortes', 'soup_deaths'),
          int('winstreak', 'Winstreak', 'soup_winstreak'),
        ],
        { endpoints: ['soup'] },
      ),
    ],
  },
  {
    key: 'gladiator',
    label: 'Duels: Gladiator',
    source: ['duels'],
    profile: { stats: ['duels'], badge: 'gladiator_level_badge' },
    title: title(['GLADIATOR', '#b2bec3']),
    variants: [
      geral(
        [
          prefixed('xp', 'XP Mensal', 'gladiator_exp_'),
          int('wins', 'Vitórias', 'gladiator_wins'),
          int('deaths', 'Mortes', 'gladiator_deaths'),
          int('winstreak', 'Winstreak', 'gladiator_winstreak'),
        ],
        { endpoints: ['gladiator'] },
      ),
    ],
  },
  {
    key: 'bridge',
    label: 'The Bridge',
    source: ['duels'],
    profile: { stats: ['duels'], badge: 'bridge_level_badge' },
    title: title(['THE', '#ff1616'], ['BRIDGE', '#33c2ea']),
    variants: [
      geral(
        [
          int('wins', 'Vitórias', 'bridge_wins'),
          int('losses', 'Derrotas', 'bridge_losses'),
          int('points', 'Pontos', 'bridge_points'),
        ],
        { endpoints: ['bridge'] },
      ),
    ],
  },
];

export const LEADERBOARD_GAMES_BY_KEY = new Map(
  LEADERBOARD_GAMES.map((game) => [game.key, game]),
);

/** Opções de "modo" do comando. */
export function getModeChoices(game) {
  return game.variants.map((variant) => ({ name: variant.label, value: variant.key }));
}

/** Opções de "tipo" do comando (união das colunas de todos os modos). */
export function getTypeChoices(game) {
  const seen = new Set();
  const choices = [];

  for (const variant of game.variants) {
    for (const column of variant.columns) {
      if (seen.has(column.key)) continue;
      seen.add(column.key);
      choices.push({ name: column.label, value: column.key });
    }
  }

  return choices.slice(0, 25);
}

export function getVariant(game, key) {
  return game.variants.find((variant) => variant.key === key) ?? null;
}
