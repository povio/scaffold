import type { Project } from 'ts-morph';
import type { z } from 'zod';

import { ScaffoldingHandler } from './scaffolding-handler';

/**
 * Declarative request for a certain status
 *  - can be handled by multiple executors
 *  - executors are run by their modules
 *  - priority is of the request determines the order of execution
 *     of all requests made to the executing module
 */
export interface IRequest {
  // Module that made the request
  module: IModule<any>;

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
  status: 'uninitialised' | 'initialised' | 'error' | 'disabled';

  // Human-readable status messages
  messages: IMessage[];

  /**
   * Executors matched to the request
   *  - set by the ScaffoldingHandler after all modules have been initialized
   */
  tasks: ITask[];

  type: 'request';
}

export interface ITask extends ITaskContext {
  executor: IExecutor;
  request: IRequest;
  type: 'task';
}

/**
 * Imperative executor of requests
 *  - idempotent, can detect if it can skip or disable itself
 *  - runs for each request
 *  - runs after other executors of the same module in the order
 *     of their set priority
 */
export interface IExecutor {
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
   * Optional executor instance init step
   *  - runs once per request, after all modules have been initialized
   */
  init?: (
    task: ITask,
    actions: {
      addMessage: (type: 'error' | 'warning' | 'info', message: string, error?: Error) => IMessage;
      withTsMorph: (func: (context: { project: Project }) => Promise<void>) => Promise<void>;
    },
  ) => Promise<void>;

  // Exception behaviour
  exception: 'ignore' | 'throw';

  /**
   * Optional executor instance run step
   *  - executor modules can also execute themselves
   *  - plugins can be executed by the ScaffoldingHandler
   */
  exec?: (
    task: ITask,
    actions: {
      addMessage: (type: 'error' | 'warning' | 'info', message: string, error?: Error) => IMessage;
      withTsMorph: (func: (context: { project: Project }) => Promise<void>) => Promise<void>;
    },
  ) => Promise<void>;

  module: IModule<any>;

  type: 'executor';
}

/**
 * A work load made from a request and an executor
 */
interface ITaskContext {
  /**
   * Task instance status
   *  - disabled: executor matched, but it gracefully disabled itself
   *  - queued: executor matched and is waiting to be executed
   *  - invalid: executor matched, but it cannot run due to en error
   *  - completed: exec completed successfully
   *  - error: error while init/exec
   */
  status: 'disabled' | 'uninitialised' | 'queued' | 'invalid' | 'completed' | 'error';

  // Human-readable status message
  messages: IMessage[];

  /**
   *  Global task priority
   *    - determines the order of execution of all tasks
   *    - low priority tasks are executed first
   */
  priority: number;

  // Custom status of the executor, passed from executor init to exec
  data?: Record<string, any>;
}

/**
 * Container for executors and requests
 */
export interface IModule<ConfigSchema extends z.ZodObject<any, any, any>> {
  // Globally unique name
  name: string;

  // Semantic version of the module
  version?: string;

  // Human-readable description of the module
  description?: string;

  /**
   * Module status
   * - uninitialised: module has not been initialized, config is not set or validated
   * - disabled: module has been disabled by the configuration or internal logic
   * - invalid: module failed to initialize due to missing or invalid context
   * - queued: module has requests to process
   * - completed: module has completed all requests
   */
  status: 'uninitialised' | 'queued' | 'disabled' | 'invalid' | 'completed' | 'error';

  messages: IMessage[];

  // Requests made by this module
  requests: IRequest[];

  // Executors provided by this module
  executors: IExecutor[];

  // Tasks created by the requests
  tasks: ITask[];

  /**
   * Zod config schema
   *  validated before init
   */
  configSchema?: ConfigSchema;

  // Config instance
  config?: Record<string, any>;

  /**
   * Initialize the module
   *  - introduce requests and executors
   *  - all modules and their configs are resolved
   */
  init?: IModuleInit<ConfigSchema>;

  type: 'module';
}

export type IModuleInit<ConfigSchema extends z.ZodObject<any, any, any>> = (
  context: {
    // Path to root of the project
    cwd: string;
    // All registered and their configs
    modules: Record<string, IModuleStub<any>>;
    // Zod-validated config
    config?: z.infer<ConfigSchema>;
  },
  actions: {
    addRequest: (request: Partial<IRequest> & { match: string }) => Promise<IRequest>;
    addExecutor: (executor: Partial<IExecutor> & { match: string }) => Promise<IExecutor>;
    setStatus: (status: IModule<any>['status']) => void;
    addMessage: (type: 'error' | 'warning' | 'info', message: string, error?: Error) => IMessage;
  },
) => Promise<void>;

type Optional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type IModuleStub<ConfigSchema extends z.ZodObject<any, any, any>> = Omit<
  Optional<IModule<ConfigSchema>, 'messages' | 'config' | 'status'>,
  'requests' | 'executors' | 'tasks' | 'type'
> & {
  requests?: Array<Partial<IRequest> & { match: string }>;
  executors?: Array<Partial<IExecutor> & { match: string }>;
  type?: 'module-stub';
};

export interface IMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  error?: Error;
}

export type IEventHandler = (
  source: IModuleStub<any> | IModule<any> | IRequest | IExecutor | ITask | ScaffoldingHandler,
  event: string,
  data?: any,
) => void;
