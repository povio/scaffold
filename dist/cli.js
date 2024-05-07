#!/usr/bin/env node
"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }


var _chunkH7KHBFKSjs = require('./chunk-H7KHBFKS.js');

// src/cli.ts
var _yargs = require('yargs'); var _yargs2 = _interopRequireDefault(_yargs);
var _helpers = require('yargs/helpers');

// package.json
var version = "1.0.0";

// src/cli/apply.ts
var command = {
  command: "apply",
  describe: "apply scaffolding",
  builder: {},
  handler: async () => {
    try {
      const cwd = process.cwd();
      const sh = new (0, _chunkH7KHBFKSjs.ScaffoldingHandler)(cwd);
      for await (const module of _chunkH7KHBFKSjs.findScaffoldFiles.call(void 0, {
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