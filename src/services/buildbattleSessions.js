import { deleteSession, getSession, saveSession } from './sessionStore.js';

const GAME = 'buildbattle';

function normalizeUsername(value) {
  return String(value ?? '').toLowerCase();
}

export function ensureBuildBattleSession(discordId, player) {
  const username = player.account.username;
  const baseline = player.stats?.buildbattle ?? {};
  const existing = getSession(discordId, GAME);

  if (existing && normalizeUsername(existing.username) === normalizeUsername(username)) {
    return existing;
  }

  const session = {
    discordId,
    game: GAME,
    username,
    baseline,
    startedAt: Date.now(),
  };

  saveSession(session);
  return session;
}

export function getActiveBuildBattleSession(discordId) {
  return getSession(discordId, GAME);
}

export function resetBuildBattleSession(discordId) {
  deleteSession(discordId, GAME);
}
