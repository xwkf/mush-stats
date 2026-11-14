import { logger } from '../core/logger.js';

const API_BASE = 'https://mush.com.br/api';
const LEADERBOARD_CACHE_MS = 60_000;
let bedwarsXpTable = null;
let bedwarsLeaderboard = null;
let bedwarsLeaderboardAt = 0;

export async function fetchPlayer(identifier, period) {
  try {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    const response = await fetch(`${API_BASE}/player/${encodeURIComponent(identifier)}${query}`);
    const body = await response.json();

    if (!response.ok || !body?.success) return null;
    return body.response;
  } catch (error) {
    logger.warn(`Falha ao buscar jogador "${identifier}": ${error.message}`);
    return null;
  }
}

export async function fetchParkour(username) {
  try {
    const response = await fetch(
      `${API_BASE}/player/name/${encodeURIComponent(username)}/parkour`,
    );
    const body = await response.json();

    if (!response.ok || !body?.success) return null;
    return body.response;
  } catch (error) {
    logger.warn(`Falha ao buscar parkour de "${username}": ${error.message}`);
    return null;
  }
}

export async function fetchMissions(username) {
  try {
    const response = await fetch(
      `${API_BASE}/player/name/${encodeURIComponent(username)}/missions`,
    );
    const body = await response.json();

    if (!response.ok || !body?.success) return null;
    return body.response;
  } catch (error) {
    logger.warn(`Falha ao buscar missões de "${username}": ${error.message}`);
    return null;
  }
}

export async function fetchBedwarsQuickBuy(username) {
  try {
    const response = await fetch(
      `${API_BASE}/player/name/${encodeURIComponent(username)}/bedwars`,
    );
    const body = await response.json();

    if (!response.ok || !body?.success) return null;
    return body.response;
  } catch (error) {
    logger.warn(`Falha ao buscar a Compra Rápida de "${username}": ${error.message}`);
    return null;
  }
}

export async function fetchBedwarsXpTable() {
  if (bedwarsXpTable) return bedwarsXpTable;

  try {
    const response = await fetch(`${API_BASE}/games/bedwars/xptable`);
    const body = await response.json();
    const table = body?.response ?? body;

    if (!response.ok || !table || typeof table !== 'object') return null;

    bedwarsXpTable = table;
    return bedwarsXpTable;
  } catch (error) {
    logger.warn(`Falha ao buscar a tabela de XP do Bed Wars: ${error.message}`);
    return null;
  }
}

export async function fetchBedwarsLeaderboard() {
  if (bedwarsLeaderboard && Date.now() - bedwarsLeaderboardAt < LEADERBOARD_CACHE_MS) {
    return bedwarsLeaderboard;
  }

  try {
    const response = await fetch(`${API_BASE}/leaderboard/bedwars`);
    const body = await response.json();
    const records = body?.records ?? body?.response?.records;

    if (!response.ok || !Array.isArray(records)) return null;

    bedwarsLeaderboard = records;
    bedwarsLeaderboardAt = Date.now();
    return bedwarsLeaderboard;
  } catch (error) {
    logger.warn(`Falha ao buscar a leaderboard do Bed Wars: ${error.message}`);
    return null;
  }
}

export function findBedwarsLeaderboardEntry(records, player) {
  if (!Array.isArray(records)) return null;

  const uuid = player?.account?.unique_id?.toLowerCase();
  const username = player?.account?.username?.toLowerCase();

  return (
    records.find((entry) => {
      const entryUuid = entry?.account?.unique_id?.toLowerCase();
      const entryUsername = entry?.account?.username?.toLowerCase();

      return (uuid && entryUuid === uuid) || (username && entryUsername === username);
    }) ?? null
  );
}
