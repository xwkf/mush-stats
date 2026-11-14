import { getLinkedNick, saveLink } from './links.js';
import { fetchPlayer } from './mush.js';

const NICK_PATTERN = /^[A-Za-z0-9_]{3,16}$/;

export function isValidNick(nick) {
  return NICK_PATTERN.test(nick);
}

function getNickCandidates(user) {
  const candidates = [user.username, user.globalName]
    .filter((value) => typeof value === 'string')
    .filter((value) => isValidNick(value));

  return [...new Set(candidates)];
}

export async function resolvePlayer(user, nick, period) {
  let player = null;

  if (nick) {
    player = await fetchPlayer(nick, period);
  } else {
    const linkedNick = getLinkedNick(user.id);
    if (linkedNick) player = await fetchPlayer(linkedNick, period);

    if (!player) {
      for (const candidate of getNickCandidates(user)) {
        const candidatePlayer = await fetchPlayer(candidate, period);

        if (candidatePlayer?.discord?.id === user.id) {
          player = candidatePlayer;
          break;
        }
      }
    }
  }

  if (player?.discord?.id) {
    saveLink(player.discord.id, player.account.username);
  }

  return player;
}
