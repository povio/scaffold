var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/core/scaffolding-module.ts
import { debug as _debug } from "debug";
var debug = _debug("scaffold:module");
var ScaffoldingModule = class {
  static {
    __name(this, "ScaffoldingModule");
  }
  name;
  requests;
  executors;
  version;
  priority;
  enabled;
  configSchema;
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
import { debug as _debug3 } from "debug";
import { Project } from "ts-morph";

// src/core/scaffolding-config.ts
import { cosmiconfigSync } from "cosmiconfig";
import { debug as _debug2 } from "debug";
var debug2 = _debug2("scaffold:config");
function loadConfig(cwd) {
  const explorer = cosmiconfigSync("scaffold", {
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
var debug3 = _debug3("scaffold:handler");
var ScaffoldingHandler = class {
  static {
    __name(this, "ScaffoldingHandler");
  }
  cwd;
  tsMorphProject;
  modulesDict;
  executors;
  config;
  logger(level, message, context) {
    console.log(`[${level}] ${context ? `[${context}]` : ""} ${message}`);
  }
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.modulesDict = {};
    this.executors = [];
    this.config = {};
    this.tsMorphProject = new Project({
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
              debug3(`init ${module.name}	 -> ${exe?.match.module} 	${exe?.description ? ` -> ${exe.description}` : ""}`);
              requestExecutors.push({
                context: {
                  state
                },
                executor: exe
              });
            }
          } else {
            debug3(`init* ${module.name}	 -> ${exe?.match.module} 	${exe?.description ? ` -> ${exe.description}` : ""}`);
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
import { debug as _debug4 } from "debug";
import { glob } from "fast-glob";
import { jsVariants } from "interpret";
import { extname } from "node:path";
import { pathToFileURL } from "node:url";
import { prepare } from "rechoir";
var debug4 = _debug4("scaffold:finder");
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
      const urlForConfig = pathToFileURL(module).href;
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
  const ext = extname(path);
  if (ext === ".json" || !Object.keys(jsVariants).includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }
  prepare(jsVariants, path);
  return await tryRequireThenImport(path);
}
__name(loadModule, "loadModule");
async function* findScaffoldFiles(context) {
  for (const file of await glob([
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
import * as tsMorph from "ts-morph";
import * as semver from "semver";
import * as zod from "zod";

export {
  ScaffoldingModule,
  ScaffoldingHandler,
  findScaffoldFiles,
  tsMorph,
  semver,
  zod
};
//# sourceMappingURL=chunk-I54NF36I.mjs.map