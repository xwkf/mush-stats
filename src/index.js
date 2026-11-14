import { Events } from 'discord.js';
import { config } from './config.js';
import { createClient } from './core/client.js';
import { logger } from './core/logger.js';
import { loadCommands } from './handlers/commands.js';
import { loadComponents } from './handlers/components.js';
import { loadEvents } from './handlers/events.js';

async function bootstrap() {
  const client = createClient();

  client.on(Events.Error, (error) => logger.error('Erro no cliente Discord:', error));
  client.on(Events.Warn, (message) => logger.warn(message));

  await loadCommands(client);
  await loadComponents(client);
  await loadEvents(client);

  process.on('unhandledRejection', (reason) => logger.error('Promise rejeitada sem tratamento:', reason));
  process.on('uncaughtException', (error) => logger.error('Exceção não capturada:', error));

  const shutdown = async (signal) => {
    logger.warn(`Sinal ${signal} recebido, encerrando...`);
    await client.destroy();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  await client.login(config.token);
}

bootstrap().catch((error) => {
  logger.error('Falha ao iniciar o bot:', error);
  process.exit(1);
});
