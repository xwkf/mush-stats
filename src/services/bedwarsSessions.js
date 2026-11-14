import { deleteSession, getSession, saveSession } from './sessionStore.js';

function normalizeUsername(value) {
  return String(value ?? '').toLowerCase();
}

const GAME = 'bedwars';

export function ensureSession(discordId, player) {
  const username = player.account.username;
  const baseline = player.stats?.bedwars ?? {};
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

export function getActiveSession(discordId) {
  return getSession(discordId, GAME);
}

export function resetSession(discordId) {
  deleteSession(discordId, GAME);
}
