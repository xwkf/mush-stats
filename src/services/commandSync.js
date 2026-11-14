import {
  ApplicationIntegrationType,
  InteractionContextType,
  REST,
  Routes,
} from 'discord.js';
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
  const body = commands.map((command) => ({
    ...command.data.toJSON(),
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
    contexts: [
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ],
  }));
  const rest = new REST({ version: '10', timeout: 30_000 }).setToken(config.token);
  const names = body.map((command) => command.name).join(', ');

  await withRetry('Registrar comandos globais', () =>
    rest.put(Routes.applicationCommands(config.clientId), { body }),
  );
  logger.info(`${body.length} comando(s) globais registrados: ${names}`);
  logger.info('Contextos ativos: servidor, DM do bot e canais privados (user install).');

  let guilds = [];
  try {
    guilds = await withRetry('Buscar servidores', () => rest.get(Routes.userGuilds()));
  } catch (error) {
    logger.warn(`Não foi possível listar servidores para limpar comandos antigos: ${error.message}`);
    if (config.guildId) guilds = [{ id: config.guildId }];
  }

  for (const guild of guilds) {
    await withRetry(`Remover comandos antigos de ${guild.name ?? guild.id}`, () =>
      rest.put(Routes.applicationGuildCommands(config.clientId, guild.id), { body: [] }),
    );
  }

  if (guilds.length > 0) {
    logger.info('Comandos antigos de servidor removidos; usando apenas os globais.');
  }
}
