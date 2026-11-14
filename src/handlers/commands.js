import { logger } from '../core/logger.js';
import { loadModules } from '../core/loader.js';

export async function readCommandModules() {
  const modules = await loadModules('commands');
  const commands = [];

  for (const { name, module } of modules) {
    if (!module?.data || typeof module.execute !== 'function') {
      logger.warn(`Comando ignorado (formato inválido): ${name}`);
      continue;
    }

    commands.push(module);
  }

  return commands;
}

export async function loadCommands(client) {
  const commands = await readCommandModules();

  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  logger.info(`${commands.length} comando(s) carregado(s).`);
  return commands;
}
