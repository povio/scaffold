import { cosmiconfigSync } from 'cosmiconfig';
import { debug as _debug } from 'debug';

const debug = _debug('scaffold:config');

export function loadConfig(cwd: string): Record<string, any> {
  const explorer = cosmiconfigSync('scaffold', {
    stopDir: cwd,
    searchPlaces: [
      `.scaffold/scaffold.config.json`,
      `.scaffold/scaffold.config.yaml`,
      `.scaffold/scaffold.config.yml`,
      `.scaffold/scaffold.config.js`,
      `.scaffold/scaffold.config.ts`,
      `.scaffold/scaffold.config.cjs`,
      `scaffold.config.json`,
      `scaffold.config.yaml`,
      `scaffold.config.yml`,
      `scaffold.config.js`,
      `scaffold.config.ts`,
      `scaffold.config.cjs`,
    ],
    mergeSearchPlaces: false,
  });
  const result = explorer.search(cwd);
  if (!result || result.isEmpty) {
    debug(`no config found`);
    return {};
  }
  debug(`using ${result.filepath}`);
  return result.config;
}
