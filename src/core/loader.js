import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

export async function loadModules(folder) {
  let files;

  try {
    files = walk(join(SRC_DIR, folder));
  } catch {
    return [];
  }

  const modules = [];

  for (const file of files) {
    const imported = await import(pathToFileURL(file).href);
    const module = imported.default ?? imported;
    const name = relative(join(SRC_DIR, folder), file).replace(/\\/g, '/').replace(/\.js$/, '');
    modules.push({ name, module });
  }

  return modules;
}
