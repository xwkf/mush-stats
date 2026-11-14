import { logger } from '../core/logger.js';

const API_BASE = 'https://mush.com.br/api';
const PROFILE_CACHE_MS = 5 * 60_000;

const profileCache = new Map();

function readGroup(record, source) {
  const flat = {};

  for (const [rawKey, value] of Object.entries(record ?? {})) {
    const separator = rawKey.indexOf(':');
    if (separator === -1) continue;

    const group = rawKey.slice(0, separator);
    if (!source.includes(group)) continue;

    flat[rawKey.slice(separator + 1)] = value;
  }

  if (Object.keys(flat).length > 0) return flat;

  return (
    source
      .map((name) => record?.stats?.[name] ?? record?.[name])
      .find((value) => value && typeof value === 'object') ?? {}
  );
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickFirst(group) {
  for (const value of Object.values(group ?? {})) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function pickPrefix(group, prefix) {
  const keys = Object.keys(group ?? {})
    .filter((key) => key.startsWith(prefix) && Number.isFinite(Number(group[key])))
    .sort()
    .reverse();

  return keys.length > 0 ? number(group[keys[0]]) : 0;
}

function readColumnValue(group, column) {
  if (column.format === 'ratio') {
    const numerator = number(group?.[column.numerator]);
    const denominator = number(group?.[column.denominator]);
    return denominator > 0 ? numerator / denominator : numerator;
  }

  if (column.pick === 'first') return pickFirst(group);
  if (column.pickPrefix) return pickPrefix(group, column.pickPrefix);

  return number(group?.[column.field ?? column.key]);
}

export function normalizeRecord(record, index, game, variant) {
  const account = record.account ?? record.player ?? {};
  const group = readGroup(record, game.source);
  const level = number(group.level ?? record.level);
  const badge = group.level_badge?.format ?? record.level_badge?.format ?? null;
  const values = {};

  for (const column of variant.columns) {
    values[column.key] = readColumnValue(group, column);
  }

  return {
    apiPosition: Number(record.pos ?? record.position ?? index + 1),
    position: Number(record.pos ?? record.position ?? index + 1),
    uuid: String(account.unique_id ?? record.unique_id ?? '').replaceAll('-', ''),
    username: account.username ?? record.username ?? record.name ?? '???',
    nameColor:
      record.color ??
      record.best_tag?.color ??
      record.profile_tag?.color ??
      record.rank_tag?.color,
    clan: record.clan?.tag ? { tag: record.clan.tag, color: record.clan.tag_color } : null,
    badge,
    level,
    xp: 0,
    values,
  };
}

async function fetchProfile(username) {
  const cached = profileCache.get(username);
  if (cached && Date.now() - cached.at < PROFILE_CACHE_MS) return cached.profile;

  try {
    const response = await fetch(`${API_BASE}/player/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json();
    const profile = response.ok && body?.success ? body.response : null;

    if (profile) profileCache.set(username, { at: Date.now(), profile });
    return profile;
  } catch (error) {
    logger.warn(`Falha ao enriquecer o jogador "${username}": ${error.message}`);
    return null;
  }
}

async function enrichEntry(entry, game) {
  const profile = await fetchProfile(entry.username);
  if (!profile) return entry;

  const stats =
    game.profile?.stats
      ?.map((name) => profile.stats?.[name])
      .find((value) => value && typeof value === 'object') ?? {};

  const badgeKey = game.profile?.badge;
  if (badgeKey && stats[badgeKey]?.format) entry.badge = stats[badgeKey].format;

  if (game.profile?.level) entry.level = number(stats[game.profile.level] ?? entry.level);

  if (Number.isFinite(Number(stats.xp))) {
    entry.xp = Number(stats.xp);
    if ('xp' in entry.values) entry.values.xp = entry.xp;
  }

  if (profile.clan?.tag) {
    entry.clan = { tag: profile.clan.tag, color: profile.clan.tag_color };
  }

  entry.nameColor =
    profile.best_tag?.color ?? profile.profile_tag?.color ?? entry.nameColor;

  return entry;
}

async function fetchRecords(variant) {
  for (const endpoint of variant.endpoints ?? []) {
    try {
      const response = await fetch(`${API_BASE}/leaderboard/${endpoint}`, {
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.json();
      const records = body?.records ?? body?.response?.records ?? body?.response;

      if (response.ok && Array.isArray(records)) return records;
    } catch (error) {
      logger.warn(`Falha ao buscar a leaderboard "${endpoint}": ${error.message}`);
    }
  }

  return null;
}

export async function fetchLeaderboardTop(game, variant, typeKey, limit = 10) {
  const records = await fetchRecords(variant);
  if (!records) return null;

  const typeColumn =
    variant.columns.find((column) => column.key === typeKey) ?? variant.columns[0];

  const entries = records
    .map((record, index) => normalizeRecord(record, index, game, variant))
    .sort((left, right) => {
      const difference =
        number(right.values[typeColumn.key]) - number(left.values[typeColumn.key]);

      return difference || left.apiPosition - right.apiPosition;
    })
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  return Promise.all(entries.map((entry) => enrichEntry(entry, game)));
}
