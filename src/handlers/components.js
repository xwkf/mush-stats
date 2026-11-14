import { logger } from '../core/logger.js';
import { loadModules } from '../core/loader.js';

const COMPONENT_FOLDERS = {
  buttons: 'components/buttons',
  selectMenus: 'components/selectMenus',
  modals: 'components/modals',
};

export async function loadComponents(client) {
  for (const [collectionName, folder] of Object.entries(COMPONENT_FOLDERS)) {
    const modules = await loadModules(folder);
    let loaded = 0;

    for (const { name, module } of modules) {
      if (!module?.customId || typeof module.execute !== 'function') {
        logger.warn(`Componente ignorado (formato inválido): ${name}`);
        continue;
      }

      client[collectionName].set(module.customId, module);
      loaded += 1;
    }

    logger.info(`${loaded} ${collectionName} carregado(s).`);
  }
}
