import { Handler, findScaffoldFiles, Status } from '@povio/scaffold';
import yargs from 'yargs';

import { scaffoldingLogger } from '../core/scaffolding-logger';

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise<void>((resolve) =>
    process.stdin.once('data', () => {
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
    yes: {
      describe: 'Auto-apply',
      type: 'boolean',
      default: false,
    },
  },
  handler: async (args) => {
    try {
      const cwd = args.cwd as string;
      const verbose = args.verbose as boolean;

      const sh = new Handler(cwd, scaffoldingLogger({ verbose }));

      for await (const module of findScaffoldFiles({ cwd })) {
        sh.register(module);
      }

      // load all modules
      await sh.init();

      if (sh.status === Status.queued) {
        console.log(`Press any key to execute ${sh.tasks.filter((x) => x.status === Status.queued)} tasks:`);
        await keypress();
        await sh.exec();
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
