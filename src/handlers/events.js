import { logger } from '../core/logger.js';
import { loadModules } from '../core/loader.js';

export async function loadEvents(client) {
  const modules = await loadModules('events');
  let loaded = 0;

  for (const { name, module } of modules) {
    if (!module?.name || typeof module.execute !== 'function') {
      logger.warn(`Evento ignorado (formato inválido): ${name}`);
      continue;
    }

    const run = (...args) => module.execute(client, ...args);

    if (module.once) client.once(module.name, run);
    else client.on(module.name, run);

    loaded += 1;
    logger.debug(`Evento registrado: ${module.name}`);
  }

  logger.info(`${loaded} evento(s) carregado(s).`);
}
