import { debug as _debug } from 'debug';
import { Project } from 'ts-morph';

import type { ScaffoldingExecutor, ScaffoldingModuleAbstract } from './scaffolding.interfaces';

const debug = _debug('scaffold:handler');

export class ScaffoldingHandler<SM extends ScaffoldingModuleAbstract> {
  public readonly tsMorphProject;
  public readonly modulesDict: Record<string, SM> = {};
  public readonly executors: ScaffoldingExecutor[] = [];

  public logger(level: 'info' | 'warn' | 'error', message: string, context?: string) {
    // eslint-disable-next-line no-console
    console.log(`[${level}] ${context ? `[${context}]` : ''} ${message}`);
  }

  constructor(
    //
    public readonly cwd: string = process.cwd(),
  ) {
    this.tsMorphProject = new Project({ tsConfigFilePath: `${cwd}/tsconfig.json` });
  }

  register(module: SM) {
    if (!module.name) {
      throw new Error('name is required');
    }
    if (module.name in this.modulesDict) {
      throw new Error(`ScaffoldingModule ${module.name} already exists`);
    }
    // debug(`register ${module.name}`);
    this.modulesDict[module.name] = module;
  }

  /**
   * Initialize all modules
   */
  async init() {
    // list of all registered modules
    const modules = Object.values(this.modulesDict);

    // init all modules
    for (const module of modules) {
      /**
       * ScaffoldingModuleAbstract.init
       */
      if (module.init) {
        await module.init(
          {
            cwd: this.cwd,
            // todo, pass in config
            modules: this.modulesDict,
            config: {},
            // todo, pass in persisted store
            store: {},
            // todo, pass in run arguments
            arguments: {},
          },
          {
            tsMorphProject: this.tsMorphProject,
            // todo, expand logger for more contextual messages
            logger: this.logger,
          },
        );
        // the module might have disabled itself by setting enabled to false
      } else {
        debug(`init* ${module.name}`);
      }
    }

    // register all executors
    for (const module of modules) {
      this.executors.push(
        ...module.executors.map((x) => ({
          // add module to matcher
          ...x,
          match: { ...x.match, module: module.name },
        })),
      );
    }

    /**
     * Initialize all module requests
     */
    for (const module of modules) {
      for (const request of module.requests.filter((x) => Object.keys(x.match).length > 0)) {
        request.module = module;
        const requestExecutors: {
          context: {
            state?: Record<string, any>;
          };
          executor: ScaffoldingExecutor;
        }[] = [];
        for await (const exe of this.executors) {
          if (!exe.match || !Object.entries(request.match).every(([key, value]) => exe.match[key] === value)) {
            continue;
          }
          if (exe.init) {
            /**
             * ScaffoldingExecutor.init
             */
            const { disabled, state } = await exe.init(
              {
                request,
              },
              {
                tsMorphProject: this.tsMorphProject,
                // todo, expand logger for more contextual messages
                logger: this.logger,
              },
              // stub for response
              {
                disabled: false,
                state: {},
              },
            );
            if (!disabled) {
              // init executor
              debug(
                `init ${module.name}\t -> ${exe?.match.module} \t${exe?.description ? ` -> ${exe.description}` : ''}`,
              );
              requestExecutors.push({
                context: {
                  state,
                },
                executor: exe,
              });
            }
          } else {
            debug(
              `init* ${module.name}\t -> ${exe?.match.module} \t${exe?.description ? ` -> ${exe.description}` : ''}`,
            );
            requestExecutors.push({
              context: {},
              executor: exe,
            });
          }
        }
        request.executors = requestExecutors;
        if (request.executors.length === 0 && !request.optional) {
          // todo, add more context to the error message
          throw new Error(
            `No executors found for ${module.name} ${request.description ? ` -> ${request.description}` : ''}`,
          );
        }
      }
    }
  }

  /**
   * Execute all modules
   */
  async exec() {
    const modules = Object.values(this.modulesDict)
      // filter out disabled modules
      .filter((x) => x.enabled)
      // order by priority
      .sort((a, b) => a.priority - b.priority);

    for await (const module of modules) {
      /**
       * ScaffoldingModuleAbstract.exec
       */
      // const { store } =
      await module.exec(
        {
          cwd: this.cwd,
          modules: this.modulesDict,
          config: {}, // todo, pass in config
          store: {}, // todo pass in persisted store
          arguments: {}, // todo, pass in run arguments
        },
        {
          tsMorphProject: this.tsMorphProject,
          // todo, expand logger for more contextual messages
          logger: this.logger,
        },
      );
      // todo, persist the returned store
    }

    // apply code changes
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
}
