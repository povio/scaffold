#!/usr/bin/env node
import {
  ScaffoldingHandler,
  findScaffoldFiles
} from "./chunk-I54NF36I.mjs";

// src/cli.ts
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// package.json
var version = "1.0.0";

// src/cli/apply.ts
var command = {
  command: "apply",
  describe: "apply scaffolding",
  builder: {
    cwd: {
      describe: "Root directory of the project",
      demandOption: true,
      type: "string",
      default: process.cwd()
    }
  },
  handler: async (args) => {
    try {
      const cwd = args.cwd;
      const sh = new ScaffoldingHandler(cwd);
      for await (const module of findScaffoldFiles({
        cwd
      })) {
        sh.register(module);
      }
      await sh.init();
      await sh.exec();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
};

// src/cli.ts
yargs(hideBin(process.argv)).version(version).scriptName("scaffold").command(command).help().demandCommand(1).strictCommands(true).showHelpOnFail(true).fail((msg, err) => {
  if (msg)
    console.log(msg);
  if (err) {
    console.error(err);
  }
  console.log("Use '--help' for more info");
  process.exit(1);
}).parse();
//# sourceMappingURL=cli.mjs.map