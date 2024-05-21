import { Project } from 'ts-morph';
import { type z } from 'zod';

import { loadConfig } from './scaffolding-config';
import type {
  IEventHandler,
  IExecutor,
  IMessage,
  IModule,
  IModuleStub,
  IRequest,
  ITask,
} from './scaffolding.interfaces';

export class ScaffoldingHandler {
  // All modules
  public readonly modulesDict: Record<string, IModule<any>> = {};
  public readonly moduleStubDict: Record<string, IModuleStub<any>> = {};

  // Raw cosmiconfig
  public readonly rawConfig: Record<string, any> = {};

  // All executors
  public readonly executors: IExecutor[] = [];

  // All tasks
  public readonly tasks: ITask[] = [];

  // All requests
  public readonly requests: IRequest[] = [];

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

  constructor(
    public readonly cwd: string = process.cwd(),
    private readonly onEvent: IEventHandler = () => {},
  ) {
    this.tsMorphProject = new Project({ tsConfigFilePath: `${cwd}/tsconfig.json` });
    this.rawConfig = loadConfig(this.cwd);
  }

  public register<ConfigSchema extends z.ZodObject<any, any, any>>(module: IModuleStub<ConfigSchema>) {
    if (this.status !== 'uninitialized') {
      throw new Error(`Cannot register module after initialization: ${this.status}`);
    }

    if (!module.name) {
      throw new Error('name is required');
    }

    if (module.name in this.moduleStubDict) {
      throw new Error(`ScaffoldingModule ${module.name} already exists`);
    }

    module.type = 'module-stub';

    this.moduleStubDict[module.name] = module;
    this.onEvent(module, 'register');
    return module;
  }

  /**
   * Initialize all modules
   */
  async init() {
    this.status = 'configuring';
    this.onEvent(this, 'configuring');

    /**
     * Load config for all modules
     */
    for (const moduleStub of Object.values(this.moduleStubDict)) {
      let config = moduleStub.name! in this.rawConfig ? this.rawConfig[moduleStub.name!] : undefined;
      if (moduleStub.configSchema) {
        // validate the config if schema is provided
        const { success, data, error } = await moduleStub.configSchema.safeParseAsync(config || {});
        if (!success) {
          throw new Error(`Invalid config for ${moduleStub.name}: ${error}`);
        }
        config = data;
        this.onEvent(moduleStub, 'configure', config);
      }
      moduleStub.config = config;
    }

    const createRequest = (request: Partial<IRequest> & { module: IModule<any>; match: string }): IRequest => {
      return {
        type: 'request',
        messages: [],
        status: 'uninitialised',
        priority: 0,
        optional: false,
        tasks: [],
        ...request,
      };
    };

    const initRequest = async (request: IRequest): Promise<IRequest> => {
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
      if (executors.length < 1 && !request.optional) {
        request.status = 'error';
        this.onEvent(request, 'init:error');
        return request;
      }

      for (const executor of executors) {
        const task: ITask = {
          type: 'task',
          messages: [],
          request,
          executor,
          /**
           * Priority of the task
           *  - take the executor priority to determine the global project priority
           *     of the type of task
           *  - add a small fraction of the request priority to determine the
           *      priority of the task within all the same type of tasks
           */
          priority: executor.priority + request.priority / 1000,
          status: 'uninitialised',
        };

        const addMessage = (type: 'error' | 'warning' | 'info', _message: string, error?: Error) => {
          const message: IMessage = { type, message: _message, error };
          task.messages.push(message);
          this.onEvent(task, 'message', message);
          return message;
        };

        const withTsMorph = async (func: (context: { project: Project }) => Promise<void>) => {
          await func({ project: this.tsMorphProject });
        };

        if (executor.init) {
          try {
            await executor.init(task, {
              addMessage,
              withTsMorph,
            });
          } catch (e: any) {
            const message: IMessage = { type: 'error', message: e.message };
            task.messages.push(message);
            this.onEvent(task, 'message', message);
            task.status = 'error';
          }
        }

        if (task.status === 'uninitialised') {
          // enqueue task for execution
          task.status = executor.exec ? 'queued' : 'completed';
        }

        // add to module tasks for tracking purposes
        request.module.tasks.push(task);

        // add to global tasks for execution
        this.tasks.push(task);

        if (task.status === 'error') {
          // fatal error
          this.onEvent(task, 'init:error');
        } else {
          this.onEvent(task, 'init');
        }
      }

      this.onEvent(request, 'init');

      return request;
    };

    /**
     * Find all executors
     */
    this.status = 'loading-executors';
    this.onEvent(this, 'loading-executors');
    for (const moduleStub of Object.values(this.moduleStubDict)) {
      const module: IModule<any> = {
        ...moduleStub,
        type: 'module',
        status: 'uninitialised',
        requests: [],
        executors: [],
        messages: [],
        tasks: [],
      };
      this.modulesDict[module.name] = module;

      const addRequest = async (_request: Partial<IRequest> & { match: string }) => {
        const request = createRequest({ ..._request, module: _request.module ?? module });
        module.requests.push(request);
        this.requests.push(request);
        this.requests.sort((a, b) => a.priority - b.priority);
        this.onEvent(request, 'register');
        if (['loading-tasks'].includes(this.status)) {
          await initRequest(request);
        }
        return request;
      };

      const addExecutor = async (_executor: Partial<IExecutor> & { match: string }) => {
        if (!['loading-executors'].includes(this.status)) {
          throw new Error('Cannot add executor outside of module init');
        }
        const executor: IExecutor = {
          type: 'executor',
          module,
          priority: 0,
          exception: 'throw',
          ..._executor,
        };
        module.executors.push(executor);
        this.executors.push(executor);
        this.onEvent(executor, 'register');
        return executor;
      };

      const setStatus = (status: IModule<any>['status']) => {
        module.status = status;
        this.onEvent(module, 'status');
      };

      const addMessage = (type: 'error' | 'warning' | 'info', _message: string, error?: Error) => {
        const message: IMessage = { type, message: _message, error };
        module.messages.push(message);
        this.onEvent(module, 'message', message);
        return message;
      };

      if (moduleStub.executors) {
        await Promise.all(moduleStub.executors.map(addExecutor));
      }
      if (moduleStub.requests) {
        await Promise.all(moduleStub.requests.map(addRequest));
      }

      if (module.init) {
        try {
          await module.init(
            {
              cwd: this.cwd,
              modules: this.moduleStubDict,
              config: module.config,
            },
            {
              addRequest,
              addExecutor,
              setStatus,
              addMessage,
            },
          );
        } catch (e: any) {
          module.status = 'error';
          const message: IMessage = { type: 'error', message: e.message };
          module.messages.push(message);
          this.onEvent(module, 'message', message);
        }
      }
      if (module.status === 'uninitialised') {
        module.status = 'queued';
      } else if (module.status === 'error') {
        // fatal error
        this.onEvent(module, 'error');
        return;
      } else {
        this.onEvent(module, 'init');
      }
    }

    this.status = 'loading-tasks';
    this.onEvent(this, 'loading-tasks');

    /**
     * Init all tasks
     */
    for (const module of Object.values(this.modulesDict)) {
      await initRequest(
        createRequest({ description: 'Before all tasks', match: `${module.name}:#before-all`, module, optional: true }),
      );
    }
    while (this.requests.length > 0) {
      await initRequest(this.requests.shift()!);
    }
    for (const module of Object.values(this.modulesDict)) {
      await initRequest(
        createRequest({ description: 'After all tasks', match: `${module.name}:#after-all`, module, optional: true }),
      );
    }

    if (
      this.tasks.some((x) => x.status === 'error') ||
      Object.values(this.modulesDict).some((x) => x.status === 'error' || x.requests.some((y) => y.status === 'error'))
    ) {
      this.status = 'error';
    } else {
      this.status = 'prepared';
      this.onEvent(this, 'prepared');
    }
  }

  /**
   * Execute all tasks
   */
  async exec() {
    this.status = 'executing';
    this.onEvent(this, 'executing');
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
        // this.onEvent(task, 'exec:before');

        const addMessage = (type: 'error' | 'warning' | 'info', _message: string, error?: Error) => {
          const message: IMessage = { type, message: _message, error };
          task.messages.push(message);
          this.onEvent(task, 'message', message);
          return message;
        };

        const withTsMorph = async (func: (context: { project: Project }) => Promise<void>) => {
          await func({ project: this.tsMorphProject });
        };

        await task.executor.exec(task, {
          addMessage,
          withTsMorph,
        });
        task.status = 'completed';
      } catch (e: any) {
        const message: IMessage = { type: 'error', message: e.message };
        task.messages.push(message);
        this.onEvent(task, 'message', message);
        task.status = 'error';
        if (task.executor.exception === 'throw') {
          // fatal error
          throw e;
        } else {
          this.onEvent(task, 'exec:error', e);
        }
      }
      // this.onEvent(task, 'exec:after');
    }

    // apply typescript changes
    await this.tsMorphProject.save();
    this.status = 'done';
    this.onEvent(this, 'done');
  }

  public readonly type = 'handler' as const;
}

/**
 * Helper function that returns a module stub
 * to abstract away the type of the module
 */
export function createScaffolding<ConfigSchema extends z.ZodObject<any, any, any>>(
  data: IModuleStub<ConfigSchema>,
): IModuleStub<ConfigSchema> {
  return data;
}
