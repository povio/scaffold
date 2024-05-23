import type { IExecutorParams, IHandler, IRequest, ITask, IZod, Observable } from './scaffolding.interfaces';
import type { IExecutor, IMessage, IModule, IModuleInit } from './scaffolding.interfaces';

export class Module<ConfigSchema extends IZod> implements Observable {
  constructor(
    props: Omit<IModule<ConfigSchema>, 'addRequest'>,
    private handler: IHandler,
  ) {
    this.name = props.name;
    this.version = props.version ?? '1.0.0';
    this.description = props.description;
    this.messages = [];
    this._init = props.init;
    this.tasks = [];
    this.configSchema = props.configSchema;
    this.config = props.config;
    this._requests = props.requests ?? [];
    this._executors = props.executors ?? [];
    this.requests = [];
    this.executors = [];

    this.handler.onEvent('register', this, props);
  }

  get id() {
    return this.name;
  }

  // Globally unique name
  public readonly name: string;
  // Semantic version of the module
  public readonly version: string;
  // Human-readable description of the module
  public readonly description?: string;

  private _status: 'uninitialized' | 'error' | 'disabled' | 'queued' = 'uninitialized';

  public get status() {
    return this._status;
  }

  public set status(status: Module<ConfigSchema>['_status']) {
    this._status = status;
    this.handler.onEvent('status', this, status);
  }

  messages: IMessage[];

  public addMessage(type: IMessage['type'], message: string, error?: Error) {
    const msg = { type, message, error, status: this.status };
    this.messages.push(msg);
    this.handler.onEvent('message', this, msg);
    return msg;
  }

  private readonly _requests: IModule<ConfigSchema>['requests'];
  private readonly _executors: IModule<ConfigSchema>['executors'];

  // Requests made by this module
  requests: Request[];
  // Executors provided by this module
  executors: Executor[];

  // Tasks created by the requests
  tasks: ITask[];

  /**
   * Zod config schema
   *  validated before init
   */
  public readonly configSchema?: ConfigSchema;
  config?: Record<string, any>;

  public async initConfig(config: Record<string, any>) {
    if (this.configSchema) {
      // validate the config if schema is provided
      const { success, data, error } = await this.configSchema.safeParseAsync(config || {});
      if (!success) {
        throw new Error(`Invalid config for ${this.name}: ${error}`);
      }
      this.config = data;
      this.handler.onEvent('configure', this, config);
    }
  }

  /**
   * Initialize the module
   *  - introduce requests and executors
   *  - all modules and their configs are resolved
   */
  public async runInit(
    config: Parameters<IModuleInit<ConfigSchema>>[0],
    _plugins: Omit<Parameters<IModuleInit<ConfigSchema>>[1], 'addMessage' | 'setStatus'>,
  ) {
    if (this.status !== 'uninitialized') {
      throw new Error('Module has already been initialized');
    }
    const plugins: Parameters<IModuleInit<ConfigSchema>>[1] = {
      ..._plugins,
      addMessage: (...args) => this.addMessage(...args),
      setStatus: (status: Module<any>['_status']) => {
        this.status = status;
      },
    };
    try {
      if (this._executors) {
        await Promise.all(this._executors.map(plugins.addExecutor));
      }
      if (this._requests) {
        await Promise.all(this._requests.map(plugins.addRequest));
      }
      if (this._init) {
        await this._init(config, plugins);
      }
    } catch (error: any) {
      this.addMessage('error', 'Error while initializing module', error);
      this.status = 'error';
    }
    if (this.status === 'uninitialized') {
      this.status = this.requests.length < 1 && this.executors.length < 1 ? 'disabled' : 'queued';
    }
  }

  private readonly _init?: IModuleInit<ConfigSchema>;
}

/**
 * Declarative request for a certain status
 *  - can be handled by multiple executors
 *  - executors are run by their modules
 *  - priority is of the request determines the order of execution
 *     of all requests made to the executing module
 */
export class Request implements Observable {
  constructor(
    props: IRequest,
    module: Module<any>,
    private handler: IHandler,
  ) {
    this.description = props.description;
    this.match = props.match;
    this.value = props.value;
    this.optional = props.optional ?? false;
    this.priority = props.priority ?? 0;
    this.messages = [];
    this.tasks = [];

    // override the module if provided
    this.module = props.module ?? module;
    module.requests.push(this);

    this.id = handler.makeId(`${this.module.id}:request`);
    this.handler.onEvent('register', this, props);
  }

  public readonly id: string;

  public module: Module<any>;

  // Description for the request
  description?: string;

  /**
   * Matching string used to find the executor
   * - Set the module to match only one module/executor
   * - `[module]:[match]`
   */
  match: string;

  // Value passed to the executor
  value?: Record<string, any>;

  /**
   * If true and match is set, no executors found will not cause an error
   */
  optional?: boolean;

  /**
   * Priority of initialization of a request/task
   */
  priority: number;

  // Status of the request

  /**
   * Request status
   */
  private _status: 'uninitialized' | 'queued' | 'completed' | 'error' | 'disabled' = 'uninitialized';

  public get status() {
    return this._status;
  }

  public set status(status: Request['_status']) {
    this._status = status;
    this.handler.onEvent('status', this, status);
  }

  public addMessage(type: IMessage['type'], message: string, error?: Error) {
    const msg = { type, message, error, status: this.status };
    this.messages.push(msg);
    this.handler.onEvent('message', this, msg);
    return msg;
  }

  // Human-readable status messages
  messages: IMessage[];

  /**
   * Executors matched to the request
   *  - set by the ScaffoldingHandler after all modules have been initialized
   */
  tasks: ITask[];
}

/**
 * Imperative executor of requests
 *  - idempotent, can detect if it can skip or disable itself
 *  - runs for each request
 *  - runs after other executors of the same module in the order
 *     of their set priority
 */
export class Executor implements Observable {
  constructor(
    props: IExecutor,
    public module: Module<any>,
    private handler: IHandler,
  ) {
    this.module = module;
    this.description = props.description;
    this.match = props.match;
    this.priority = props.priority ?? 0;
    this.exception = props.exception ?? 'ignore';
    this._exec = props.exec;
    this._init = props.init;

    this.module.executors.push(this);
    this.id = handler.makeId(`${this.module.id}:executor`);
    this.handler.onEvent('register', this);
  }

  public readonly id: string;

  // Human-readable description
  description?: string;

  /**
   * Matching string used to match the request
   *  - the module name is prepended to the match string
   */
  match: string;

  /**
   * Used in calculating the priority of the task
   */
  priority: number;

  /**
   * Optional Init step
   *  - runs at task init
   */
  get init() {
    return this._init;
  }

  private readonly _init?: IExecutorParams;

  // Exception behaviour
  exception: 'ignore' | 'throw';

  /**
   * Optional executor instance run step
   *  - executor modules can also execute themselves
   *  - plugins can be executed by the ScaffoldingHandler
   */
  get exec() {
    return this._exec;
  }

  public status = 'registered' as const;

  private readonly _exec?: IExecutorParams;
}

/**
 * A work load made from a request and an executor
 */
export class Task implements Observable {
  constructor(
    params: ITask,
    private handler: IHandler,
    public executor: Executor,
    public request: Request,
  ) {
    this.messages = [];
    this.priority = executor.priority + request.priority / 1000;

    // add to requester module for tracking purposes
    this.request.module.tasks.push(this);
    this.id = handler.makeId(`${this.request.module.id}->${this.executor.id}->task`);
    this.handler.onEvent('register', this);
  }

  public readonly id: string;

  async runInit(actions: Omit<Parameters<IExecutorParams>[1], 'addMessage'>) {
    if (this.executor.init) {
      try {
        await this.executor.init(this, { ...actions, addMessage: this.addMessage });
      } catch (error: any) {
        this.status = 'error';
        this.addMessage('error', 'Error while task init', error);
        if (this.executor.exception === 'throw') {
          throw error;
        }
      }
    }
    this.status = this.executor.exec ? 'queued' : 'completed';
  }

  async runExec(actions: Omit<Parameters<IExecutorParams>[1], 'addMessage'>) {
    if (!this.executor.exec) {
      throw new Error('No exec function defined');
    }
    try {
      await this.executor.exec(this, { ...actions, addMessage: this.addMessage });

      if (this.status === 'queued') {
        this.status = 'completed';
      }
    } catch (error: any) {
      this.status = 'error';
      this.addMessage('error', 'Error while task exec', error);
      if (this.executor.exception === 'throw') {
        throw error;
      }
    }
  }

  /**
   * Task instance status
   *  - disabled: executor matched, but it gracefully disabled itself
   *  - queued: executor matched and is waiting to be executed
   *  - invalid: executor matched, but it cannot run due to en error
   *  - completed: exec completed successfully or nothing to do
   *  - error: error while init/exec
   */
  private _status: 'disabled' | 'uninitialized' | 'queued' | 'completed' | 'error' = 'uninitialized';

  public get status() {
    return this._status;
  }

  public set status(status: Task['_status']) {
    this._status = status;
    this.handler.onEvent('status', this, status);
  }

  // Human-readable status message
  messages: IMessage[];

  public addMessage(type: IMessage['type'], message: string, error?: Error) {
    const msg = { type, message, error, status: this.status };
    this.messages.push(msg);
    this.handler.onEvent('message', this, msg);
    return msg;
  }

  /**
   *  Global task priority
   *    - determines the order of execution of all tasks
   *    - low priority tasks are executed first
   */
  priority: number;

  // Custom status of the executor, passed from executor init to exec
  data?: Record<string, any>;
}
