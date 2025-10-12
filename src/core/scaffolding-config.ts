import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { debug as _debug } from 'debug';
import { parse } from 'yaml';

const debug = _debug('scaffold:config');

export function loadConfig(cwd: string): Record<string, any> {
  const configPaths = [
    `.scaffold/scaffold.config.yaml`,
    `.scaffold/scaffold.config.yml`,
    `.scaffold/scaffold.config.json`,
    `scaffold.config.yaml`,
    `scaffold.config.yml`,
    `scaffold.config.json`,
  ];

  for (const cP of configPaths) {
    const cPath = join(cwd, cP);
    if (existsSync(cPath)) {
      debug(`using ${cPath}`);
      const cContent = readFileSync(cPath, 'utf-8');
      if (cP.endsWith('.json')) {
        return JSON.parse(cContent);
      }
      if (cP.endsWith('.yml') || cP.endsWith('.yaml')) {
        return parse(cContent);
      }
    }
  }

  debug(`no config found`);
  return {};
}
