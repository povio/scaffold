#!/usr/bin/env node

import { applyCommand } from './cli/apply';

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error(`
NAME:
  scaffold - Scaffolding tools for Typescript projects

USAGE:
  Resolve configuration files using templates and (remote) variables.

  Documentation is available at https://github.com/povio/scaffold

VERSION:
  ${process.env.SCAFFOLD_VERSION}

AUTHOR:
  {Marko Zabreznik marko.zabreznik@povio.com}

COMMANDS
  apply - Apply a configuration set

COPYRIGHT:
  (c) 2025 Povio inc., All rights reserved.
`);
  process.exit(1);
}

switch (command) {
  case 'apply':
    applyCommand(args);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
