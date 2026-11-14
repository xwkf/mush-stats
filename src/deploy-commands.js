import { logger } from './core/logger.js';
import { syncCommands } from './services/commandSync.js';

try {
  await syncCommands();
} catch (error) {
  logger.error('Falha ao registrar os comandos:', error);
  process.exit(1);
}
