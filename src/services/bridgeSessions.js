import { deleteSession, getSession, saveSession } from './sessionStore.js';

const GAME = 'bridge';

function normalizeUsername(value) {
  return String(value ?? '').toLowerCase();
}

export function ensureBridgeSession(discordId, player) {
  const username = player.account.username;
  const baseline = player.stats?.duels ?? {};
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

export function getActiveBridgeSession(discordId) {
  return getSession(discordId, GAME);
}

export function resetBridgeSession(discordId) {
  deleteSession(discordId, GAME);
}
