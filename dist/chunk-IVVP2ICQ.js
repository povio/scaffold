"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/core/scaffolding-module.ts
var _debug5 = require('debug');
var debug = _debug5.debug.call(void 0, "scaffold:module");
var ScaffoldingModule = class {
  static {
    __name(this, "ScaffoldingModule");
  }
  
  
  
  
  
  
  
  constructor(name, requests = [], executors = []) {
    this.name = name;
    this.requests = requests;
    this.executors = executors;
    this.version = "1.0.0";
    this.priority = 50;
    this.enabled = true;
  }
  /**
  * Execute the module requests
  *  by default, this will execute all the requests, made by this module in order of creation
  *  when the order is important, or there are additional tasks, you can extend this class
  *
  *  ScaffoldingModuleAbstract.exec
  */
  async exec(context, plugins) {
    for await (const request of this.requests) {
      if (!request.executors || request.executors.length < 1) {
        continue;
      }
      for (const ex of request.executors) {
        if (!ex.executor.exec) {
          continue;
        }
        debug(`execute ${this.name} -> ${ex.executor.match.module} ${ex.executor.description ? ` -> ${ex.executor.description}` : ""}`);
        await ex.executor.exec({
          request,
          state: ex.context.state
        }, plugins);
      }
    }
    return {};
  }
};

// src/core/scaffolding-handler.ts

var _tsmorph = require('ts-morph'); var tsMorph = _interopRequireWildcard(_tsmorph);

// src/core/scaffolding-config.ts
var _cosmiconfig = require('cosmiconfig');

var debug2 = _debug5.debug.call(void 0, "scaffold:config");
function loadConfig(cwd) {
  const explorer = _cosmiconfig.cosmiconfigSync.call(void 0, "scaffold", {
    stopDir: cwd,
    searchPlaces: [
      `.scaffold/scaffold.config.json`,
      `.scaffold/scaffold.config.yaml`,
      `.scaffold/scaffold.config.yml`,
      `.scaffold/scaffold.config.js`,
      `.scaffold/scaffold.config.ts`,
      `.scaffold/scaffold.config.cjs`,
      `scaffold.config.json`,
      `scaffold.config.yaml`,
      `scaffold.config.yml`,
      `scaffold.config.js`,
      `scaffold.config.ts`,
      `scaffold.config.cjs`
    ],
    mergeSearchPlaces: false
  });
  const result = explorer.search(cwd);
  if (!result || result.isEmpty) {
    debug2(`no config found`);
    return {};
  }
  debug2(`using ${result.filepath}`);
  return result.config;
}
__name(loadConfig, "loadConfig");

// src/core/scaffolding-handler.ts
var debug3 = _debug5.debug.call(void 0, "scaffold:handler");
var ScaffoldingHandler = class {
  static {
    __name(this, "ScaffoldingHandler");
  }
  
  
  
  
  
  logger(level, message, context) {
    console.log(`[${level}] ${context ? `[${context}]` : ""} ${message}`);
  }
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.modulesDict = {};
    this.executors = [];
    this.config = {};
    this.tsMorphProject = new (0, _tsmorph.Project)({
      tsConfigFilePath: `${cwd}/tsconfig.json`
    });
    this.config = loadConfig(this.cwd);
  }
  register(module) {
    if (!module.name) {
      throw new Error("name is required");
    }
    if (module.name in this.modulesDict) {
      throw new Error(`ScaffoldingModule ${module.name} already exists`);
    }
    this.modulesDict[module.name] = module;
  }
  /**
  * Initialize all modules
  */
  async init() {
    const modules = Object.values(this.modulesDict);
    for (const module of modules) {
      let config = module.name && module.name in this.config ? this.config[module.name] : void 0;
      if (module.configSchema) {
        const { success, data, error } = await module.configSchema.safeParseAsync(config || {});
        if (!success) {
          throw new Error(`Invalid config for ${module.name}: ${error}`);
        }
        config = data;
      }
      if (module.init) {
        await module.init({
          cwd: this.cwd,
          // todo, pass in config
          modules: this.modulesDict,
          config,
          // todo, pass in persisted store
          store: {},
          // todo, pass in run arguments
          arguments: {}
        }, {
          tsMorphProject: this.tsMorphProject,
          // todo, expand logger for more contextual messages
          logger: this.logger
        });
      } else {
        debug3(`init* ${module.name}`);
      }
    }
    for (const module of modules) {
      this.executors.push(...module.executors.map((x) => ({
        // add module to matcher
        ...x,
        match: {
          ...x.match,
          module: module.name
        }
      })));
    }
    for (const module of modules) {
      for (const request of module.requests.filter((x) => Object.keys(x.match).length > 0)) {
        request.module = module;
        const requestExecutors = [];
        for await (const exe of this.executors) {
          if (!exe.match || !Object.entries(request.match).every(([key, value]) => exe.match[key] === value)) {
            continue;
          }
          if (exe.init) {
            const { disabled, state } = await exe.init(
              {
                request
              },
              {
                tsMorphProject: this.tsMorphProject,
                // todo, expand logger for more contextual messages
                logger: this.logger
              },
              // stub for response
              {
                disabled: false,
                state: {}
              }
            );
            if (!disabled) {
              debug3(`init ${module.name}	 -> ${_optionalChain([exe, 'optionalAccess', _ => _.match, 'access', _2 => _2.module])} 	${_optionalChain([exe, 'optionalAccess', _3 => _3.description]) ? ` -> ${exe.description}` : ""}`);
              requestExecutors.push({
                context: {
                  state
                },
                executor: exe
              });
            }
          } else {
            debug3(`init* ${module.name}	 -> ${_optionalChain([exe, 'optionalAccess', _4 => _4.match, 'access', _5 => _5.module])} 	${_optionalChain([exe, 'optionalAccess', _6 => _6.description]) ? ` -> ${exe.description}` : ""}`);
            requestExecutors.push({
              context: {},
              executor: exe
            });
          }
        }
        request.executors = requestExecutors;
        if (request.executors.length === 0 && !request.optional) {
          throw new Error(`No executors found for ${module.name} ${request.description ? ` -> ${request.description}` : ""}`);
        }
      }
    }
  }
  /**
  * Execute all modules
  */
  async exec() {
    const modules = Object.values(this.modulesDict).filter((x) => x.enabled).sort((a, b) => a.priority - b.priority);
    for await (const module of modules) {
      await module.exec({
        cwd: this.cwd,
        modules: this.modulesDict,
        config: {},
        store: {},
        arguments: {}
      }, {
        tsMorphProject: this.tsMorphProject,
        // todo, expand logger for more contextual messages
        logger: this.logger
      });
    }
    await this.tsMorphProject.save();
  }
  /**
  * De-register all modules
  */
  reset() {
    for (const key in this.modulesDict) {
      delete this.modulesDict[key];
    }
  }
};

// src/core/scaffolding-finder.ts

var _fastglob = require('fast-glob');
var _interpret = require('interpret');
var _path = require('path');
var _url = require('url');
var _rechoir = require('rechoir');
var debug4 = _debug5.debug.call(void 0, "scaffold:finder");
async function tryRequireThenImport(module) {
  let result;
  try {
    result = __require(module);
  } catch (error) {
    let importEsm;
    try {
      importEsm = new Function("id", "return import(id);");
    } catch (e) {
      importEsm = void 0;
    }
    if (error.code === "ERR_REQUIRE_ESM" && importEsm) {
      const urlForConfig = _url.pathToFileURL.call(void 0, module).href;
      result = (await importEsm(urlForConfig)).default;
      return result;
    }
    throw error;
  }
  if (result && typeof result === "object" && "default" in result)
    result = result.default || {};
  return result || {};
}
__name(tryRequireThenImport, "tryRequireThenImport");
async function loadModule(path) {
  const ext = _path.extname.call(void 0, path);
  if (ext === ".json" || !Object.keys(_interpret.jsVariants).includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }
  _rechoir.prepare.call(void 0, _interpret.jsVariants, path);
  return await tryRequireThenImport(path);
}
__name(loadModule, "loadModule");
async function* findScaffoldFiles(context) {
  for (const file of await _fastglob.glob.call(void 0, [
    "**/.*.scaffold.*",
    "**/.scaffold.*"
  ], {
    cwd: context.cwd,
    dot: true,
    ignore: [
      "node_modules"
    ]
  })) {
    debug4(`found ${file}`);
    try {
      yield await loadModule(`${context.cwd}/${file}`);
    } catch (error) {
      console.error(error);
    }
  }
}
__name(findScaffoldFiles, "findScaffoldFiles");

// src/index.ts

var _semver = require('semver'); var semver = _interopRequireWildcard(_semver);
var _zod = require('zod'); var zod = _interopRequireWildcard(_zod);








exports.ScaffoldingModule = ScaffoldingModule; exports.ScaffoldingHandler = ScaffoldingHandler; exports.findScaffoldFiles = findScaffoldFiles; exports.tsMorph = tsMorph; exports.semver = semver; exports.zod = zod;
//# sourceMappingURL=chunk-IVVP2ICQ.js.map