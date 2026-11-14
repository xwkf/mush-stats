import { logger } from '../core/logger.js';
import { resolveSource } from '../constants/compare.js';

const API_BASE = 'https://mush.com.br/api';

// ---------------------------------------------------------------------------
// ATENÇÃO: o formato exato de /api/leaderboard/<jogo> (parâmetros de modo/período e
// campos dos registros) não está no código do bot. Tudo o que depende disso fica
// aqui (buildUrl + normalizeRecord), para ajustar em um lugar só.
// ---------------------------------------------------------------------------
function buildUrl(game, mode, type) {
  const url = new URL(`${API_BASE}/leaderboard/${game.endpoint}`);
  if (mode.prefix) url.searchParams.set('mode', mode.prefix);
  if (type.param) url.searchParams.set('period', type.param);
  return url.toString();
}

export function normalizeRecord(record, index, game, mode, type) {
  const account = record.account ?? record.player ?? {};
  const container = record.stats ?? record;

  let { group, prefix } = resolveSource(container, game.source);
  if (Object.keys(group).length === 0) group = record.stats ?? record;
  if (mode.prefix) prefix = mode.prefix;
  else if (mode.prefix === '') prefix = '';

  const badge = group.level_badge?.format ?? record.level_badge?.format ?? null;
  const level = Number(group.level ?? record.level ?? 0);

  return {
    position: Number(record.pos ?? record.position ?? index + 1),
    uuid: String(account.unique_id ?? record.unique_id ?? '').replaceAll('-', ''),
    username: account.username ?? record.username ?? record.name ?? '???',
    nameColor: record.best_tag?.color ?? record.profile_tag?.color ?? record.rank_tag?.color,
    clan: record.clan?.tag ? { tag: record.clan.tag, color: record.clan.tag_color } : null,
    badge: game.showLevel || badge ? badge : null,
    level: game.showLevel ? level : 0,
    values: game.columns.map((column) => column.read(group, prefix, type.suffix)),
  };
}

export async function fetchLeaderboardTop(game, mode, type, limit = 10) {
  try {
    const response = await fetch(buildUrl(game, mode, type), { signal: AbortSignal.timeout(15_000) });
    const body = await response.json();
    const records = body?.records ?? body?.response?.records ?? body?.response;

    if (!response.ok || !Array.isArray(records)) return null;

    return records
      .map((record, index) => normalizeRecord(record, index, game, mode, type))
      .sort((a, b) => a.position - b.position)
      .slice(0, limit);
  } catch (error) {
    logger.warn(`Falha ao buscar a leaderboard "${game.key}": ${error.message}`);
    return null;
  }
}
