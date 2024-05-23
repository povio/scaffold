import { Project } from 'ts-morph';

import { loadConfig } from './scaffolding-config';
import { Executor, Module, Request, Task } from './scaffolding.classes';
import type { IEventHandler, IExecutor, IModule, IRequest, IZod, Observable } from './scaffolding.interfaces';

export class Handler implements Observable {
  // All modules
  public readonly modulesDict: Record<string, Module<any>> = {};

  // Raw cosmiconfig
  public readonly rawConfig: Record<string, any> = {};

  // All executors
  public readonly executors: Executor[] = [];

  // All requests
  private readonly requestQueue: Request[] = [];

  // All tasks, made from 1 request and 1 executor
  public readonly tasks: Task[] = [];

  // TsMorph Project of the current codebase
  public readonly tsMorphProject;

  private _status:
    | 'registered'
    | 'uninitialized'
    | 'loading-configs'
    | 'loading-executors'
    | 'loading-tasks'
    | 'executing'
    | 'completed'
    | 'queued'
    | 'executed' = 'uninitialized';

  constructor(
    public readonly cwd: string = process.cwd(),
    public readonly onEvent: IEventHandler = () => {},
  ) {
    this.tsMorphProject = new Project({ tsConfigFilePath: `${cwd}/tsconfig.json` });
    this.rawConfig = loadConfig(this.cwd);
    this.status = 'registered';
  }

  public register<ConfigSchema extends IZod>(module: IModule<ConfigSchema>) {
    if (!module.name || module.name in this.modulesDict) {
      throw new Error(`Can not register module "${module.name ?? '[missing name]'}"`);
    }
    this.modulesDict[module.name] = new Module(module, this);
    return module;
  }

  async registerRequest(_request: IRequest, module: Module<any>) {
    const request = new Request(_request, module, this);
    this.requestQueue.push(request);
    this.requestQueue.sort((a, b) => a.priority - b.priority);
    return request;
  }

  async registerExecutor(_executor: IExecutor, module: Module<any>) {
    if (!['loading-executors'].includes(this.status)) {
      throw new Error('Cannot add executor outside of module init');
    }
    const executor = new Executor(_executor, module, this);
    this.executors.push(executor);
    return executor;
  }

  async initTasks(request: Request): Promise<Request> {
    if (!['loading-tasks'].includes(this.status)) {
      throw new Error('Cannot init request outside of task loading step');
    }

    if (!request.description) {
      request.description = request.match;
    }

    /**
     * todo: match `*:some-request`
     */
    const executors = this.executors.filter((x) => x.match === request.match);

    if (executors.length < 1) {
      if (!request.optional) {
        request.status = 'error';
        request.addMessage('error', `No executors found for request ${request.match}`);
      } else {
        request.status = 'disabled';
      }
      return request;
    }

    for (const executor of executors) {
      const task = new Task({}, this, executor, request);

      await task.runInit({
        withTsMorph: async (func: (context: { project: Project }) => Promise<void>) => {
          await func({ project: this.tsMorphProject });
        },
      });

      if (task.status === 'queued') {
        // add to global tasks for execution
        this.tasks.push(task);
      }
    }

    request.status = 'queued';

    return request;
  }

  private set status(value: Handler['_status']) {
    this._status = value;
    this.onEvent('status', this, value);
  }

  public get status() {
    return this._status;
  }

  /**
   * Initialize all modules
   */
  async init() {
    this.status = 'loading-configs';

    /**
     * Load config for all modules
     */
    for (const module of Object.values(this.modulesDict)) {
      await module.initConfig(module.name! in this.rawConfig ? this.rawConfig[module.name!] : {});
    }

    /**
     * Find all executors
     */
    this.status = 'loading-executors';
    for (const module of Object.values(this.modulesDict)) {
      await module.runInit(
        {
          cwd: this.cwd,
          modules: this.modulesDict,
          config: module.config,
        },
        {
          addRequest: (request) => this.registerRequest(request, module),
          addExecutor: (executor) => this.registerExecutor(executor, module),
        },
      );
    }

    /**
     * Enqueue before-all and after-all tasks
     */
    for (const executor of this.executors.filter(
      (x) => x.match.endsWith(':#before-all') || x.match.endsWith(':#after-all'),
    )) {
      await this.registerRequest(
        {
          description: `run ${executor.match.endsWith(':#before-all') ? 'before' : 'after'} for ${executor.module.name}`,
          match: executor.match,
        },
        executor.module,
      );
    }

    this.status = 'loading-tasks';

    /**
     * Init all tasks
     *  - requests can be made by task.init(), so loop each time
     */
    while (this.requestQueue.length > 0) {
      await this.initTasks(this.requestQueue.shift()!);
    }

    if (this.requestQueue.length > 0) {
      throw new Error('Request queue was not emptied');
    }

    if (Object.values(this.modulesDict).some((m) => m.status === 'uninitialized')) {
      throw new Error('Modules were not initialized');
    }

    if (Object.values(this.modulesDict).some((m) => m.requests.some((r) => r.status === 'uninitialized'))) {
      throw new Error('Requests were not initialized');
    }

    this.status = this.tasks.length > 0 ? 'queued' : 'completed';
  }

  /**
   * Execute all tasks
   */
  async exec() {
    this.status = 'executing';

    // sort tasks by priority
    const queue = this.tasks.toSorted((a, b) => a.priority - b.priority);

    while (queue.length > 0) {
      const task = queue.shift();
      if (task?.status !== 'queued') {
        throw new Error('Task is not queued');
      }
      task.runExec({
        withTsMorph: async (func: (context: { project: Project }) => Promise<void>) => {
          await func({ project: this.tsMorphProject });
        },
      });
    }

    // apply typescript changes
    await this.tsMorphProject.save();
    this.status = 'executed';
  }

  ids: Record<string, number> = {};
  public makeId(namespace: string) {
    if (!this.ids[namespace]) {
      this.ids[namespace] = 0;
    }
    return `${namespace}#${this.ids[namespace]++}`;
  }
  get id() {
    return 'handler';
  }
}

/**
 * Helper function that returns a module stub
 * to abstract away the type of the module
 */
export function createScaffolding<ConfigSchema extends IZod>(data: IModule<ConfigSchema>): IModule<ConfigSchema> {
  return data;
}
