import { debug as _debug } from 'debug';
import { Project } from 'ts-morph';

import { loadConfig } from './scaffolding-config';
import type { IExecutor, IModule, IRequest, ITask } from './scaffolding.interfaces';

const debug = _debug('scaffold:handler');

export class ScaffoldingHandler {
  // All modules
  public readonly modulesDict: Record<string, IModule<any>> = {};

  // Raw cosmiconfig
  public readonly rawConfig: Record<string, any> = {};

  // All executors
  public readonly executors: IExecutor[] = [];

  // All tasks
  public readonly tasks: ITask[] = [];

  // TsMorph Project of the current codebase
  public readonly tsMorphProject;

  public status:
    | 'uninitialized'
    | 'configuring'
    | 'loading-executors'
    | 'loading-tasks'
    | 'prepared'
    | 'executing'
    | 'done'
    | 'error' = 'uninitialized';

  constructor(public readonly cwd: string = process.cwd()) {
    this.tsMorphProject = new Project({ tsConfigFilePath: `${cwd}/tsconfig.json` });
    this.rawConfig = loadConfig(this.cwd);
  }

  register(module: IModule<any>) {
    if (!module.name) {
      throw new Error('name is required');
    }
    if (module.name in this.modulesDict) {
      throw new Error(`ScaffoldingModule ${module.name} already exists`);
    }
    // debug(`register ${module.name}`);
    this.modulesDict[module.name] = module;
    return module;
  }

  /**
   * Initialize all modules
   */
  async init() {
    const modules = Object.values(this.modulesDict);

    /**
     * Load config for all modules
     */
    this.status = 'configuring';
    for (const module of modules) {
      let config = module.name! in this.rawConfig ? this.rawConfig[module.name!] : undefined;
      if (module.configSchema) {
        // validate the config if schema is provided
        const { success, data, error } = await module.configSchema.safeParseAsync(config || {});
        if (!success) {
          throw new Error(`Invalid config for ${module.name}: ${error}`);
        }
        config = data;
      }
      module.config = config;
    }

    const initRequest = async (request: IRequest, module: IModule<any>): Promise<IRequest> => {
      if (!['loading-tasks'].includes(this.status)) {
        throw new Error('Cannot init request outside of task loading step');
      }

      // match executors to tasks
      const executors = this.executors.filter((x) => x.match === request.match);

      for (const executor of executors) {
        const task: ITask = {
          request,
          executor,
          // todo, compute priority
          priority: request.priority + executor.priority * 0.1,
          status: 'uninitialised',
        };

        if (executor.init) {
          await executor.init(task, {
            tsMorphProject: this.tsMorphProject,
          });
        }

        if (task.status === 'uninitialised') {
          task.status = 'queued';
        }

        // add to module tasks for tracking purposes
        module.tasks.push(task);

        // add to global tasks for execution
        this.tasks.push(task);
      }
      return request;
    };

    /**
     * Find all executors
     */
    this.status = 'loading-executors';
    for (const module of modules) {
      if (module.init) {
        debug(`init ${module.name}`);
        await module.init(
          {
            cwd: this.cwd,
            modules: this.modulesDict,
            config: module.config,
          },
          {
            addRequest: async (_request: Omit<Partial<IRequest>, 'status'> & { match: string }) => {
              const request: IRequest = {
                module,
                priority: 0,
                tasks: [],
                ..._request,
                status: 'uninitialised',
              };
              module.requests.push(request);
              if (['loading-tasks'].includes(this.status)) {
                await initRequest(request, module);
              }
              return request;
            },
            addExecutor: async (_executor) => {
              if (!['loading-executors'].includes(this.status)) {
                throw new Error('Cannot add executor outside of module init');
              }
              const executor: IExecutor = {
                match: '*',
                priority: 0,
                exception: 'throw',
                ..._executor,
              };
              executor.match = `${module.name}:${executor.match}`;
              module.executors.push(executor);
              this.executors.push(executor);
              debug(`init ${module.name} executor ${executor.match}`);
              return executor;
            },
            setStatus: (status, message) => {
              module.status = status;
              module.message = message;
            },
          },
        );
      } else {
        debug(`init* ${module.name}`);
      }
    }

    this.status = 'loading-tasks';

    /**
     * Init all tasks
     */
    for (const module of modules) {
      for (const request of module.requests) {
        await initRequest(request, module);
      }
    }
  }

  /**
   * Execute all tasks
   */
  async exec() {
    // sort tasks by priority
    const queue = this.tasks.filter((x) => x.status === 'queued').toSorted((a, b) => a.priority - b.priority);

    while (queue.length > 0) {
      const task = queue.shift();
      if (task?.status !== 'queued') {
        continue;
      }
      if (!task.executor.exec) {
        throw new Error(`Queued task ${task.executor.match} does not have an exec method`);
      }
      try {
        await task.executor.exec(task, {
          tsMorphProject: this.tsMorphProject,
        });
        task.status = 'completed';
      } catch (e: any) {
        task.message = e.message;
        task.status = 'error';
        if (task.executor.exception === 'throw') {
          // fatal error
          throw e;
        }
      }
    }

    // apply typescript changes
    await this.tsMorphProject.save();
  }
}
