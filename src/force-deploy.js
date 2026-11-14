import { logger } from './core/logger.js';
import { syncCommands } from './services/commandSync.js';

try {
  await syncCommands();
} catch (error) {
  logger.error('Falha ao forçar o registro dos comandos:', error);
  logger.warn('O bot continuará iniciando; os comandos já registrados serão mantidos.');
}
