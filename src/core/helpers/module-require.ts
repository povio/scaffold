import Module from 'node:module';

const req = Module.prototype.require;

const imports = {
  '@povio/scaffold': '../../index',
  '@povio/scaffold/plugins/colorette': '../../plugins/colorette',
  '@povio/scaffold/plugins/debug': '../../plugins/debug',
  '@povio/scaffold/plugins/fast-glob': '../../plugins/fast-glob',
  '@povio/scaffold/plugins/lodash': '../../plugins/lodash',
  '@povio/scaffold/plugins/semver': '../../plugins/semver',
  '@povio/scaffold/plugins/ts-morph': '../../plugins/ts-morph',
  '@povio/scaffold/plugins/yaml': '../../plugins/yaml',
  '@povio/scaffold/plugins/zod': '../../plugins/zod',
};

const cache: Record<string, keyof typeof imports> = {};

// @ts-ignore
Module.prototype.require = function (...args) {
  const name = args[0];
  if (name && name.startsWith('@povio/scaffold')) {
    if (cache[name]) {
      return cache[name];
    }
    try {
      return req.apply(this, args);
    } catch (_e: any) {
      let temp;
      switch (name) {
        case '@povio/scaffold':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../index');
          break;

        case '@povio/scaffold/plugins/colorette':
          // biome-ignore lint/style/noCommonJs: <explanation>
          temp = require('../../plugins/colorette');
          break;

        case '@povio/scaffold/plugins/debug':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../plugins/debug');
          break;

        case '@povio/scaffold/plugins/fast-glob':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../plugins/fast-glob');
          break;

        case '@povio/scaffold/plugins/lodash':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../plugins/lodash');
          break;

        case '@povio/scaffold/plugins/semver':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../plugins/semver');
          break;

        case '@povio/scaffold/plugins/ts-morph':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../plugins/ts-morph');
          break;

        case '@povio/scaffold/plugins/yaml':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../plugins/yaml');
          break;

        case '@povio/scaffold/plugins/zod':
          // biome-ignore lint/style/noCommonJs: bypass
          temp = require('../../plugins/zod');
          break;

        default:
          throw new Error(`Cannot find module '${name}'`);
      }
      cache[name] = temp as any;
      return temp;
    }
  }
  return req.apply(this, args);
};
