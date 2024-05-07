#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { version } from '../package.json';
import { command as applyCommand } from './cli/apply';

yargs(hideBin(process.argv))
  .version(version)
  .scriptName('scaffold')
  .command(applyCommand)
  .help()
  .demandCommand(1)
  .strictCommands(true)
  .showHelpOnFail(true)
  .fail((msg, err) => {
    // eslint-disable-next-line no-console
    if (msg) console.log(msg);
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    // eslint-disable-next-line no-console
    console.log("Use '--help' for more info");
    process.exit(1);
  })
  .parse();
