import { logger } from '../core/logger.js';

const API_BASE = 'https://mush.com.br/api';

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

export function normalizeRecord(record, index, game) {
  const account = record.account ?? record.player ?? {};
  const group = readGroup(record, game.source);
  const level = Number(group.level ?? record.level ?? 0);
  const badge = group.level_badge?.format ?? record.level_badge?.format ?? null;

  return {
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
    level: game.showLevel ? level : 0,
    values: game.columns.map((column) => column.read(group, '', '')),
  };
}

export async function fetchLeaderboardTop(game, limit = 10) {
  try {
    const response = await fetch(`${API_BASE}/leaderboard/${game.endpoint}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json();
    const records = body?.records ?? body?.response?.records ?? body?.response;

    if (!response.ok || !Array.isArray(records)) return null;

    return records
      .map((record, index) => normalizeRecord(record, index, game))
      .sort((a, b) => a.position - b.position)
      .slice(0, limit);
  } catch (error) {
    logger.warn(`Falha ao buscar a leaderboard "${game.key}": ${error.message}`);
    return null;
  }
}
