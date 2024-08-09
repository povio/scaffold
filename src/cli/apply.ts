/* eslint no-console: 0 */

import yargs from 'yargs';

import { TsMorphModule } from '../core/modules/ts-morph.module';
import { findScaffoldFiles } from '../core/scaffolding-finder';
import { Handler } from '../core/scaffolding-handler';
import { scaffoldingLogger } from '../core/scaffolding-logger';

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise<void>((resolve) =>
    process.stdin.once('data', (data) => {
      const byteArray = [...data];
      if (byteArray.length > 0 && byteArray[0] === 3) {
        console.log('^C');
        process.exit(1);
      }
      process.stdin.setRawMode(false);
      resolve();
    }),
  );
};

export const command: yargs.CommandModule = {
  command: 'apply',
  describe: 'apply scaffolding',
  builder: {
    cwd: {
      describe: 'Root directory of the project',
      demandOption: true,
      type: 'string',
      default: process.cwd(),
    },
    verbose: {
      describe: 'Verbose output',
      type: 'boolean',
      default: false,
    },
    debug: {
      describe: 'Debug output',
      type: 'boolean',
      default: false,
    },
    yes: {
      describe: 'Auto-apply',
      type: 'boolean',
      default: false,
    },
  },
  handler: async (args) => {
    try {
      const cwd = args.cwd as string;
      const debug = args.debug as boolean;
      const verbose = args.verbose as boolean;
      const yes = args.yes as boolean;

      const sh = new Handler(cwd, scaffoldingLogger({ verbose, debug }));

      // build in modules
      sh.register(TsMorphModule);

      for await (const module of findScaffoldFiles({ cwd })) {
        sh.register(module);
      }

      // load all modules
      await sh.init();

      if (sh.status === 'queued') {
        console.log(`Press any key to execute ${sh.tasks.filter((x) => x.status === 'queued').length} tasks:`);
        if (!yes) await keypress();
        await sh.exec();
        process.exit(0);
      } else {
        console.log('No tasks to execute');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    }
  },
};
