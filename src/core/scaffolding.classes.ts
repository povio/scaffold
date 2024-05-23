import type { IExecutorParams, IHandler, IRequest, ITask, IZod } from './scaffolding.interfaces';
import type { IExecutor, IMessage, IModule, IModuleInit } from './scaffolding.interfaces';

export class Module<ConfigSchema extends IZod> {
  constructor(
    props: Omit<IModule<ConfigSchema>, 'addRequest'>,
    private handler: IHandler,
  ) {
    this.name = props.name;
    this.version = props.version ?? '1.0.0';
    this.description = props.description;
    this._status = 'uninitialised';
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

  // Globally unique name
  public readonly name: string;
  // Semantic version of the module
  public readonly version: string;
  // Human-readable description of the module
  public readonly description?: string;

  /**
   * Module status
   * - uninitialised: module has not been initialized, config is not set or validated
   * - disabled: module has been disabled by the configuration or internal logic
   * - queued: module has requests to process
   * - completed: module has completed all requests
   * - error: module has encountered an error
   */
  private _status: 'uninitialised' | 'initialised' | 'error';

  public get status() {
    return this._status;
  }

  private set status(status: Module<any>['_status']) {
    this._status = status;
    this.handler.onEvent('status', this, status);
  }

  messages: IMessage[];

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

  public addMessage(type: IMessage['type'], message: string, error?: Error) {
    const msg = { type, message, error };
    this.messages.push(msg);
    this.handler.onEvent('message', this, msg);
    return msg;
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
    if (this.status !== 'uninitialised') {
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
    if (this.status === 'uninitialised') {
      this.status = 'initialised';
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
export class Request {
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
    this._status = 'uninitialised';
    this.messages = [];
    this.tasks = [];

    // override the module if provided
    this.module = props.module ?? module;
    module.requests.push(this);

    this.handler.onEvent('register', this, props);
  }

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
  private _status: 'uninitialised' | 'initialised' | 'error' | 'disabled';

  public get status() {
    return this._status;
  }

  public set status(status: Request['_status']) {
    this._status = status;
    this.handler.onEvent('status', this, status);
  }

  public addMessage(type: IMessage['type'], message: string, error?: Error) {
    const msg = { type, message, error };
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
export class Executor {
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
    this.handler.onEvent('register', this);
  }

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

  private readonly _exec?: IExecutorParams;
}

/**
 * A work load made from a request and an executor
 */
export class Task {
  constructor(
    params: ITask,
    private handler: IHandler,
    public executor: Executor,
    public request: Request,
  ) {
    this._status = 'uninitialised';
    this.messages = [];
    this.priority = executor.priority + request.priority / 1000;

    // add to requester module for tracking purposes
    this.request.module.tasks.push(this);
    this.handler.onEvent('register', this);
  }

  async runInit(actions: Omit<Parameters<IExecutorParams>[1], 'addMessage'>) {
    if (this.executor.init) {
      try {
        await this.executor.init(this, { ...actions, addMessage: this.addMessage });
      } catch (error: any) {
        this.status = 'error';
        this.messages.push({
          type: 'error',
          message: 'Error while task init',
          error,
        });
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
      this.messages.push({
        type: 'error',
        message: 'Error while task exec',
        error,
      });
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
  private _status: 'disabled' | 'uninitialised' | 'queued' | 'completed' | 'error';

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
    const msg = { type, message, error };
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
