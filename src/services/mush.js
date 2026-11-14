import { logger } from '../core/logger.js';

const API_BASE = 'https://mush.com.br/api';
let bedwarsXpTable = null;

export async function fetchPlayer(identifier) {
  try {
    const response = await fetch(`${API_BASE}/player/${encodeURIComponent(identifier)}`);
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
