import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { logger } from '../core/logger.js';

const ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url));
const DEFAULT_DB_PATH = join(ROOT_DIR, 'data', 'sessions.db');
const DB_PATH = process.env.SESSION_DB_PATH?.trim()
  ? resolve(process.cwd(), process.env.SESSION_DB_PATH.trim())
  : DEFAULT_DB_PATH;
const PROVIDER = (process.env.SESSION_DB_PROVIDER ?? 'sqlite').toLowerCase();

function createSqliteStore() {
  let database = null;

  function getDatabase() {
    if (database) return database;

    mkdirSync(dirname(DB_PATH), { recursive: true });
    database = new DatabaseSync(DB_PATH);
    database.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        discord_id TEXT NOT NULL,
        game TEXT NOT NULL,
        username TEXT NOT NULL,
        baseline TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (discord_id, game)
      )
    `);

    const legacyTable = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'bedwars_sessions'")
      .get();

    if (legacyTable) {
      database.exec(`
        INSERT OR IGNORE INTO sessions (discord_id, game, username, baseline, started_at, updated_at)
        SELECT discord_id, 'bedwars', username, baseline, started_at, updated_at
        FROM bedwars_sessions
      `);
    }

    return database;
  }

  return {
    get(discordId, game) {
      const row = getDatabase()
        .prepare('SELECT * FROM sessions WHERE discord_id = ? AND game = ?')
        .get(discordId, game);

      if (!row) return null;

      try {
        return {
          discordId: row.discord_id,
          game: row.game,
          username: row.username,
          baseline: JSON.parse(row.baseline),
          startedAt: Number(row.started_at),
          updatedAt: Number(row.updated_at),
        };
      } catch (error) {
        logger.warn(`Sessão inválida para ${discordId}/${game}: ${error.message}`);
        return null;
      }
    },

    save({ discordId, game, username, baseline, startedAt }) {
      const now = Date.now();

      getDatabase()
        .prepare(`
          INSERT INTO sessions (discord_id, game, username, baseline, started_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(discord_id, game) DO UPDATE SET
            username = excluded.username,
            baseline = excluded.baseline,
            started_at = excluded.started_at,
            updated_at = excluded.updated_at
        `)
        .run(
          discordId,
          game,
          username,
          JSON.stringify(baseline),
          Number(startedAt) || now,
          now,
        );
    },

    delete(discordId, game) {
      getDatabase()
        .prepare('DELETE FROM sessions WHERE discord_id = ? AND game = ?')
        .run(discordId, game);
    },

    deleteAll(discordId) {
      return getDatabase()
        .prepare('DELETE FROM sessions WHERE discord_id = ?')
        .run(discordId).changes;
    },
  };
}

const PROVIDERS = {
  sqlite: createSqliteStore,
};

if (!PROVIDERS[PROVIDER]) {
  logger.warn(
    `Provedor de sessão "${PROVIDER}" não configurado; usando SQLite em ${DB_PATH}.`,
  );
}

const store = (PROVIDERS[PROVIDER] ?? PROVIDERS.sqlite)();

export function getSession(discordId, game = 'bedwars') {
  return store.get(discordId, game);
}

export function saveSession(session) {
  store.save({ ...session, game: session.game ?? 'bedwars' });
}

export function deleteSession(discordId, game = 'bedwars') {
  store.delete(discordId, game);
}

export function deleteAllSessions(discordId) {
  return store.deleteAll(discordId);
}
