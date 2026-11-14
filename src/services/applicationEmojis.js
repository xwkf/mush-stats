import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../core/logger.js';

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const EMOJI_DIR = join(SRC_DIR, '..', 'emojis');
const DATA_FILE = join(SRC_DIR, '..', 'data', 'emojis.json');
const SUPPORTED_EXTENSIONS = new Set(['.gif', '.png', '.jpg', '.jpeg', '.webp']);
const EMOJI_ALIASES = {
  BedWarsIcon: 'bedwars',
};

function readRegistry() {
  if (!existsSync(DATA_FILE)) return {};

  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    logger.warn('Registro de emojis inválido, recriando a partir do zero.');
    return {};
  }
}

function saveRegistry() {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, `${JSON.stringify(registry, null, 2)}\n`);
}

export async function syncApplicationEmojis(client) {
  if (!client.application) return;

  if (!existsSync(EMOJI_DIR)) {
    logger.warn(`Pasta de emojis não encontrada: ${EMOJI_DIR}`);
    return;
  }

  const files = readdirSync(EMOJI_DIR).filter((file) =>
    SUPPORTED_EXTENSIONS.has(extname(file).toLowerCase()),
  );

  if (files.length === 0) {
    logger.debug('Nenhum arquivo de emoji para sincronizar.');
    return;
  }

  const remote = await client.application.emojis.fetch();
  const remoteByName = new Map(remote.map((emoji) => [emoji.name, emoji]));
  let added = 0;

  for (const file of files) {
    const fileBase = basename(file, extname(file));
    const name = EMOJI_ALIASES[fileBase] ?? fileBase;
    const stored = registry[name];

    if (stored?.id && remote.has(stored.id)) continue;

    const remoteEmoji = remoteByName.get(name);

    if (remoteEmoji) {
      registry[name] = { id: remoteEmoji.id, animated: remoteEmoji.animated };
      saveRegistry();
      continue;
    }

    const attachment = readFileSync(join(EMOJI_DIR, file));
    const emoji = await client.application.emojis.create({ attachment, name });

    registry[name] = { id: emoji.id, animated: emoji.animated };
    saveRegistry();
    added += 1;
    logger.info(`Emoji adicionado: ${name} (${emoji.id})`);
  }

  logger.info(`${files.length} emoji(s) verificado(s), ${added} adicionado(s).`);
}

export function getEmoji(name) {
  const emoji = registry[name];
  if (!emoji) return '';
  return `<${emoji.animated ? 'a' : ''}:${name}:${emoji.id}>`;
}

export function getEmojiData(name) {
  const emoji = registry[name];
  if (!emoji) return null;
  return { id: emoji.id, name, animated: emoji.animated };
}

let registry = readRegistry();
