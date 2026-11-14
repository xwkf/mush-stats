import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(SRC_DIR, '..', 'data', 'links.json');

function readLinks() {
  if (!existsSync(DATA_FILE)) return {};

  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}

export function getLinkedNick(discordId) {
  return readLinks()[discordId] ?? null;
}

export function saveLink(discordId, nick) {
  const links = readLinks();

  if (links[discordId] === nick) return;

  links[discordId] = nick;
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, `${JSON.stringify(links, null, 2)}\n`);
}
