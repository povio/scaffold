import type { Project } from 'ts-morph';
import type { z } from 'zod';

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

  // If true, no executors found will not cause an error
  optional?: boolean;

  // Priority of execution
  priority: number;

  // Status of the request
  status: 'uninitialised' | 'initialised';

  /**
   * Executors matched to the request
   *  - set by the ScaffoldingHandler after all modules have been initialized
   */
  tasks: ITask[];
}

export interface ITask extends ITaskContext {
  executor: IExecutor;
  request: IRequest;
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

  // Priority of execution
  priority: number;

  /**
   * Optional executor instance init step
   *  - runs once per request, after all modules have been initialized
   */
  init?: (
    task: ITaskContext,
    plugins: {
      tsMorphProject: Project;
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
    task: ITaskContext,
    plugins: {
      tsMorphProject: Project;
    },
  ) => Promise<void>;
}

/**
 * A work load made from a request and an executor
 */
interface ITaskContext {
  /**
   * Executor instance status
   *  - disabled: executor matched, but it gracefully disabled itself
   *  - queued: executor matched and is waiting to be executed
   *  - invalid: executor matched, but it cannot run due to en error
   *  - completed: exec completed successfully
   *  - error: error while init/exec
   */
  status: 'disabled' | 'uninitialised' | 'queued' | 'invalid' | 'completed' | 'error';

  // Human-readable status message
  message?: string;

  // global task priority
  priority: number;

  // Custom status of the executor, passed from executor init to exec
  data?: Record<string, any>;
}

/**
 * Container for executors and requests
 */
export interface IModule<ConfigSchema extends z.ZodObject<any, any, any>> {
  // Globally unique name
  name?: string;

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
  status: 'uninitialised' | 'queued' | 'disabled' | 'invalid' | 'completed';

  // Human-readable status message
  message?: string;

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
}

export type IModuleInit<ConfigSchema extends z.ZodObject<any, any, any>> = (
  context: {
    // Path to root of the project
    cwd: string;
    // All registered and their configs
    modules: Record<string, IModule<any>>;
    // Zod-validated config
    config?: z.infer<ConfigSchema>;
  },
  actions: {
    addRequest: (request: Partial<IRequest> & { match: string }) => Promise<IRequest>;
    addExecutor: (executor: Partial<IExecutor>) => Promise<IExecutor>;
    setStatus: (status: IModule<any>['status'], message?: string) => void;
  },
) => Promise<void>;
