import { ScaffoldingHandler, findScaffoldFiles } from '@povio/scaffold';
import { inspect } from 'util';
import yargs from 'yargs';

import { scaffoldingLogger } from '../core/scaffolding-logger';

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
  },
  handler: async (args) => {
    try {
      const cwd = args.cwd as string;
      const verbose = args.verbose as boolean;

      const logger = verbose
        ? (source: any, event: any, data?: any) =>
            // eslint-disable-next-line no-console
            console.log(event, inspect(source, { showHidden: false, depth: 2, colors: true }), data)
        : scaffoldingLogger;

      const sh = new ScaffoldingHandler(cwd, logger);

      for await (const module of findScaffoldFiles({ cwd })) {
        sh.register(module);
      }

      // load all modules
      await sh.init();

      if (sh.status !== 'error') {
        // execute all modules in order
        // todo, ask for confirmation
        await sh.exec();
      } else {
        // eslint-disable-next-line no-console
        console.error('Error during init');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    }
  },
};
