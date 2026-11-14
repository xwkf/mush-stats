import { getLinkedNick, saveLink } from './links.js';
import { fetchPlayer } from './mush.js';

function getNickCandidates(user) {
  const candidates = [user.username, user.globalName]
    .filter((value) => typeof value === 'string')
    .filter((value) => /^[A-Za-z0-9_]{3,16}$/.test(value));

  return [...new Set(candidates)];
}

export async function resolvePlayer(user, nick) {
  let player = null;

  if (nick) {
    player = await fetchPlayer(nick);
  } else {
    const linkedNick = getLinkedNick(user.id);
    if (linkedNick) player = await fetchPlayer(linkedNick);

    if (!player) {
      for (const candidate of getNickCandidates(user)) {
        const candidatePlayer = await fetchPlayer(candidate);

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
