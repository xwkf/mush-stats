// ---------------------------------------------------------------------------
// Modos do /comparar
//
// Tudo o que depende da API do Mush fica AQUI. Cada estatística aceita uma lista
// de chaves alternativas (a primeira que existir em `player.stats.<jogo>` é usada),
// então, se algum campo vier com outro nome, é só ajustar/adicionar a chave certa.
// ---------------------------------------------------------------------------

const WINS = ['wins'];
const LOSSES = ['losses', 'defeats'];
const KILLS = ['kills'];
const DEATHS = ['deaths'];
const PLAYED = ['played', 'games_played'];

function key(prefix, name, suffix) {
  return [prefix, name, suffix].filter(Boolean).join('_');
}

/** Primeiro valor numérico existente entre as chaves (ou null). `suffix`: daily/weekly/monthly. */
function readFirst(stats, prefix, names, suffix) {
  for (const name of names) {
    const raw = stats?.[key(prefix, name, suffix)];
    if (raw === undefined || raw === null || raw === '') continue;

    const value = Number(raw);
    if (Number.isFinite(value)) return value;
  }

  return null;
}

const read = (stats, prefix, names, suffix) => readFirst(stats, prefix, names, suffix) ?? 0;
const divide = (numerator, denominator) =>
  denominator > 0 ? numerator / denominator : numerator;

export const stat = (label, ...names) => ({
  label,
  format: 'int',
  read: (stats, prefix, suffix) => read(stats, prefix, names, suffix),
});

export const ratio = (label, numerator, denominator) => {
  const numerators = Array.isArray(numerator) ? numerator : [numerator];
  const denominators = Array.isArray(denominator) ? denominator : [denominator];

  return {
    label,
    format: 'ratio',
    read: (stats, prefix, suffix) =>
      divide(
        read(stats, prefix, numerators, suffix),
        read(stats, prefix, denominators, suffix),
      ),
  };
};

// Nos modos Party, o total pode vir só por minigame (ex.: block_party_first_place).
const partyPlace = (label, place) => ({
  label,
  format: 'int',
  read: (stats, prefix, suffix) => {
    const total = readFirst(stats, prefix, [place], suffix);
    if (total !== null) return total;

    const finish = suffix ? `_${place}_${suffix}` : `_${place}`;
    let sum = 0;

    for (const [name, raw] of Object.entries(stats ?? {})) {
      if (!name.endsWith(finish)) continue;

      const value = Number(raw);
      if (Number.isFinite(value)) sum += value;
    }

    return sum;
  },
});

// Nível quando a API não expõe "level" direto (ex.: Sky Wars) e só manda o badge.
const levelField = {
  label: 'Nível',
  format: 'int',
  read: (stats, prefix, suffix) => {
    const level = readFirst(stats, prefix, ['level'], suffix);
    if (level !== null) return level;

    const badge = stats?.[key(prefix, 'level_badge')];
    const minLevel = Number(badge?.min_level);
    if (Number.isFinite(minLevel)) return minLevel;

    const match = String(badge?.format ?? '').match(/\[(\d+)/);
    return match ? Number(match[1]) : 0;
  },
};

// WLR: vitórias / derrotas (se o jogo não tiver "derrotas", usa partidas - vitórias).
const WLR = {
  label: 'WLR',
  format: 'ratio',
  read: (stats, prefix, suffix) => {
    const wins = read(stats, prefix, WINS, suffix);
    let losses = readFirst(stats, prefix, LOSSES, suffix);

    if (losses === null) {
      const played = readFirst(stats, prefix, PLAYED, suffix);
      losses = played === null ? 0 : Math.max(0, played - wins);
    }

    return divide(wins, losses);
  },
};

const KDR = ratio('KDR', KILLS, DEATHS);

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
export const COLORS = {
  white: '#ffffff',
  red: '#ff1616',
  gold: '#ffc000',
  aqua: '#33c2ea',
  cyan: '#67deff',
  blue: '#2007fa',
  pink: '#f88582',
};

const title = (...segments) =>
  segments.map(([text, color, join = false]) => ({ text, color, join }));

// ---------------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------------
const duels = (keyName, label, prefixes, name, color) => ({
  key: keyName,
  label,
  source: { stats: ['duels'], prefixes },
  title: title([name, color]),
  fields: [stat('Pontos', 'points'), stat('Vitórias', ...WINS), stat('Abates', ...KILLS), WLR, KDR],
});

export const COMPARE_MODES = [
  {
    key: 'bedwars',
    label: 'Bed Wars',
    source: { stats: ['bedwars'] },
    title: title(['BED', COLORS.red], ['WARS', COLORS.white]),
    fields: [
      stat('Nível', 'level'),
      stat('Vitórias', ...WINS),
      stat('Abates F.', 'final_kills'),
      WLR,
      KDR,
    ],
  },
  {
    key: 'skywars',
    label: 'Sky Wars',
    source: { stats: ['skywars_r1', 'skywars', 'sky_wars'] },
    title: title(['SKY', COLORS.white], ['WARS', COLORS.gold]),
    fields: [levelField, stat('Vitórias', ...WINS), stat('Abates', ...KILLS), WLR, KDR],
  },
  {
    key: 'ctf',
    label: 'CTF',
    source: { stats: ['ctf'] },
    title: title(['C', COLORS.blue], ['T', COLORS.white, true], ['F', COLORS.red, true]),
    fields: [stat('Coins', 'coins'), stat('Abates', ...KILLS), stat('Partidas', ...PLAYED)],
  },
  {
    key: 'bridge',
    label: 'The Bridge',
    source: { stats: ['duels'], prefixes: ['bridge'] },
    title: title(['THE', COLORS.red], ['BRIDGE', COLORS.aqua]),
    fields: [stat('Pontos', 'points'), stat('Vitórias', ...WINS), stat('Abates', ...KILLS), WLR, KDR],
  },
  {
    key: 'hungergames',
    label: 'Hunger Games',
    source: { stats: ['hungergames', 'hunger_games', 'hg'] },
    title: title(['HUNGER', COLORS.gold], ['GAMES', COLORS.white]),
    fields: [
      stat('Partidas', ...PLAYED),
      stat('Coins', 'coins'),
      stat('Eventos', 'mode_event_games_played'),
    ],
  },
  {
    key: 'minimush',
    label: 'Minimush',
    source: { stats: ['hungergames'], prefixes: ['mode_minimush'] },
    title: title(['MINIMUSH', COLORS.gold]),
    fields: [
      stat('Partidas', 'games_played'),
      stat('Vitórias', ...WINS),
      stat('Abates', ...KILLS),
      stat('Mortes', ...DEATHS),
      KDR,
    ],
  },
  {
    key: 'party',
    label: 'Party',
    source: { stats: ['party'] },
    title: title(['PARTY', COLORS.pink]),
    fields: [
      stat('Partidas', ...PLAYED),
      partyPlace('1° Lugar', 'first_place'),
      partyPlace('2° Lugar', 'second_place'),
      partyPlace('3° Lugar', 'third_place'),
      stat('Pontos', 'points'),
    ],
  },
  {
    key: 'murder',
    label: 'Murder',
    source: { stats: ['murder'] },
    title: title(['MURDER', COLORS.red]),
    fields: [
      stat('Partidas', ...PLAYED),
      stat('Vitórias', ...WINS),
      stat('Abates', ...KILLS),
      stat('Moedas', 'coins_picked_up', 'coins'),
      KDR,
    ],
  },
  {
    key: 'buildbattle',
    label: 'Build Battle',
    source: { stats: ['buildbattle', 'build_battle'] },
    title: title(['BUILD', COLORS.gold], ['BATTLE', COLORS.white]),
    fields: [
      stat('Nível', 'level'),
      stat('Partidas', ...PLAYED),
      stat('Vitórias', ...WINS),
      WLR,
      stat('Votos P.', 'perfects'),
    ],
  },
  {
    key: 'quickbuilders',
    label: 'Quick Builders',
    source: { stats: ['quickbuilders', 'quick_builders'] },
    title: title(['QUICK', COLORS.white], ['BUILDERS', COLORS.cyan]),
    fields: [
      stat('Nível', 'level'),
      stat('Partidas', ...PLAYED),
      stat('Vitórias', ...WINS),
      WLR,
      stat('Constr. P', 'perfect_builds', 'perfects', 'perfect_constructions'),
    ],
  },
  {
    key: 'hideandseek',
    label: 'Hide and Seek',
    source: { stats: ['seek', 'hideandseek', 'hide_and_seek', 'hide_n_seek', 'hns'] },
    title: title(['HIDE', COLORS.cyan], ['AND', COLORS.white], ['SEEK', COLORS.cyan]),
    fields: [
      stat('Partidas', ...PLAYED),
      stat('Vitórias', ...WINS),
      stat('Derrotas', ...LOSSES),
      WLR,
      stat('Blocos A.', 'hider_blocks_changed', 'blocks_found', 'found_blocks', 'blocks'),
    ],
  },

  // Duels: mesma estrutura do The Bridge, muda só o título/cor e o prefixo das chaves.
  duels('duels_sopa', 'Duels: Sopa', ['soup', 'sopa'], 'SOPA', '#ff9f43'),
  duels('duels_gladiator', 'Duels: Gladiator', ['gladiator'], 'GLADIATOR', '#b2bec3'),
  duels('duels_nodebuff', 'Duels: No Debuff', ['nodebuff', 'no_debuff'], 'NO DEBUFF', '#55efc4'),
  duels('duels_uhc', 'Duels: UHC', ['uhc'], 'UHC', '#fd79a8'),
  duels('duels_combo', 'Duels: Combo', ['combo'], 'COMBO', '#a29bfe'),
  duels('duels_gapple', 'Duels: Gapple', ['gapple'], 'GAPPLE', '#ffd32a'),
  duels('duels_sumo', 'Duels: Sumô', ['sumo'], 'SUMÔ', '#74b9ff'),
  duels('duels_boxing', 'Duels: Boxing', ['boxing'], 'BOXING', '#ff3b3b'),
  duels('duels_bedfight', 'Duels: Bed Fight', ['bedfight', 'bed_fight'], 'BED FIGHT', '#ff7675'),
  duels(
    'duels_fireball',
    'Duels: Fireball Fight',
    ['fireball', 'fireballfight', 'fireball_fight'],
    'FIREBALL FIGHT',
    '#ff6a00',
  ),
  duels(
    'duels_hgsimulator',
    'Duels: HG Simulator',
    ['hgsimulator', 'hg_simulator', 'hgsim', 'hg'],
    'HG SIMULATOR',
    '#badc58',
  ),
  duels('duels_pearl', 'Duels: Pearl Fight', ['pearlfight', 'pearl_fight', 'pearl'], 'PEARL FIGHT', '#7d6bff'),
  duels('duels_bedrush', 'Duels: Bed Rush', ['bedrush', 'bed_rush'], 'BED RUSH', '#e84393'),
];

export const COMPARE_MODES_BY_KEY = new Map(COMPARE_MODES.map((mode) => [mode.key, mode]));

/** Opções do select (o Discord aceita até 25). */
export const COMPARE_CHOICES = COMPARE_MODES.map((mode) => ({ name: mode.label, value: mode.key }));

/**
 * Lê as estatísticas de um jogador para um modo.
 * Retorna um array de números, na mesma ordem de `mode.fields`.
 */
const PROBE_NAMES = ['wins', 'kills', 'points', 'played'];

/** Acha o grupo de stats (ex.: player.stats.skywars) e o prefixo de chaves do modo. */
export function resolveSource(container, source) {
  const group =
    source.stats.map((name) => container?.[name]).find((value) => value && typeof value === 'object') ??
    {};

  const prefixes = source.prefixes ?? [''];
  const prefix =
    prefixes.find((candidate) => PROBE_NAMES.some((name) => key(candidate, name) in group)) ??
    prefixes[0];

  return { group, prefix };
}

export function readModeStats(player, mode) {
  const { group, prefix } = resolveSource(player?.stats ?? {}, mode.source);
  return mode.fields.map((field) => field.read(group, prefix));
}
