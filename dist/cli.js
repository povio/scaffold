#!/usr/bin/env node
"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }


var _chunkIVVP2ICQjs = require('./chunk-IVVP2ICQ.js');

// src/cli.ts
var _yargs = require('yargs'); var _yargs2 = _interopRequireDefault(_yargs);
var _helpers = require('yargs/helpers');

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
      const sh = new (0, _chunkIVVP2ICQjs.ScaffoldingHandler)(cwd);
      for await (const module of _chunkIVVP2ICQjs.findScaffoldFiles.call(void 0, {
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
_yargs2.default.call(void 0, _helpers.hideBin.call(void 0, process.argv)).version(version).scriptName("scaffold").command(command).help().demandCommand(1).strictCommands(true).showHelpOnFail(true).fail((msg, err) => {
  if (msg)
    console.log(msg);
  if (err) {
    console.error(err);
  }
  console.log("Use '--help' for more info");
  process.exit(1);
}).parse();
//# sourceMappingURL=cli.js.map