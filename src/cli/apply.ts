import { ScaffoldingHandler, findScaffoldFiles } from '@povio/scaffold';
import yargs from 'yargs';

export const command: yargs.CommandModule = {
  command: 'apply',
  describe: 'apply scaffolding',
  builder: {},
  handler: async () => {
    try {
      const cwd = process.cwd();

      const sh = new ScaffoldingHandler(cwd);

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
