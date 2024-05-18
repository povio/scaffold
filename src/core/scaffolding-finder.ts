import { glob } from 'fast-glob';
import { jsVariants } from 'interpret';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepare } from 'rechoir';

import type { IModule } from './scaffolding.interfaces';

/**
 * Import or require a module
 *  this allows for runtime .ts support
 * @see https://github.com/webpack/webpack-cli/blob/e480934116ec190d915e83fef8e2d945717963cb/packages/webpack-cli/src/webpack-cli.ts#L327
 */
async function tryRequireThenImport(module: string): Promise<any> {
  let result;
  try {
    result = require(module);
  } catch (error: any) {
    let importEsm: ((module: string) => Promise<{ default: any }>) | undefined;
    try {
      importEsm = new Function('id', 'return import(id);') as any;
    } catch (e) {
      importEsm = undefined;
    }
    if (error.code === 'ERR_REQUIRE_ESM' && importEsm) {
      const urlForConfig = pathToFileURL(module).href;
      result = (await importEsm(urlForConfig)).default;
      return result;
    }
    throw error;
  }
  // For babel/typescript
  if (result && typeof result === 'object' && 'default' in result) result = result.default || {};
  return result || {};
}

/**
 * Load a module from a file path
 * @see https://github.com/webpack/webpack-cli/blob/e480934116ec190d915e83fef8e2d945717963cb/packages/webpack-cli/src/webpack-cli.ts#L1717
 */
export async function loadModule(path: string): Promise<any> {
  const ext = extname(path);
  if (ext === '.json' || !Object.keys(jsVariants).includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }
  prepare(jsVariants, path);
  return await tryRequireThenImport(path);
}

export async function* findScaffoldFiles<SM extends IModule<any>>(context: { cwd: string }): AsyncGenerator<SM> {
  for (const file of await glob(['**/.*.scaffold.*', '**/.scaffold.*'], {
    cwd: context.cwd,
    dot: true, // allow dot files
    ignore: ['node_modules'],
  })) {
    // debug(`found ${file}`);
    try {
      yield await loadModule(`${context.cwd}/${file}`);
    } catch (error) {
      // todo messages
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }
}
