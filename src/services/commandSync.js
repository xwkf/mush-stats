import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../core/logger.js';
import { readCommandModules } from '../handlers/commands.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error) {
  const code = error?.code ?? error?.rawError?.code;
  const status = error?.status ?? error?.rawError?.status;

  return (
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'UND_ERR_SOCKET' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    status === 429 ||
    (typeof status === 'number' && status >= 500)
  );
}

async function withRetry(label, fn, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt === attempts) throw error;

      const wait = error.retryAfter ? error.retryAfter * 1000 : 1500 * attempt;
      logger.warn(
        `${label} falhou (${error.code ?? error.status ?? error.message}); tentando novamente em ${wait}ms...`,
      );
      await sleep(wait);
    }
  }
}

export async function syncCommands() {
  const commands = await readCommandModules();
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10', timeout: 30_000 }).setToken(config.token);
  const names = body.map((command) => command.name).join(', ');

  const guilds = config.guildId
    ? [{ id: config.guildId }]
    : await withRetry('Buscar servidores', () => rest.get(Routes.userGuilds()));

  if (guilds.length === 0) {
    await withRetry('Registrar comandos globais', () =>
      rest.put(Routes.applicationCommands(config.clientId), { body }),
    );
    logger.info(`${body.length} comando(s) registrados globalmente: ${names}`);
    return;
  }

  for (const guild of guilds) {
    await withRetry(`Registrar comandos em ${guild.name ?? guild.id}`, () =>
      rest.put(Routes.applicationGuildCommands(config.clientId, guild.id), { body }),
    );
    logger.info(
      `${body.length} comando(s) registrados no servidor ${guild.name ?? guild.id} (instantâneo).`,
    );
  }

  await withRetry('Remover comandos globais duplicados', () =>
    rest.put(Routes.applicationCommands(config.clientId), { body: [] }),
  );
  logger.info('Comandos globais removidos para evitar duplicação.');
  logger.info(`Comandos ativos: ${names}`);
}
