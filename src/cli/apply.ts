import { ScaffoldingHandler, findScaffoldFiles } from '@povio/scaffold';
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
  },
  handler: async (args) => {
    try {
      const cwd = args.cwd as string;

      const sh = new ScaffoldingHandler(cwd, scaffoldingLogger);

      for await (const module of findScaffoldFiles({ cwd })) {
        sh.register(module);
      }

      // load all modules
      await sh.init();

      // execute all modules in order
      // todo, ask for confirmation
      await sh.exec();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    }
  },
};
