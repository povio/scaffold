import type { Project } from 'ts-morph';
import { z } from 'zod';

export type ScaffoldingModuleLogger = (level: 'info' | 'warn' | 'error', message: string, context?: string) => void;

export interface ScaffoldingModuleAbstract<ConfigSchema extends z.ZodObject<any, any, any>> {
  /**
   * Unique name
   */
  name?: string;

  /**
   * If this module is enabled
   *  - run init and executor
   *  - can disable itself at init
   */
  enabled: boolean;

  /**
   *
   */
  priority: number;

  /**
   * Requests this module made
   */
  requests: ScaffoldingRequest[];

  /**
   * Executors this module provides
   */
  executors: ScaffoldingExecutor[];

  /**
   * Zod config schema
   *  validated before init, if provided
   */
  configSchema?: ConfigSchema;

  /**
   * Initialize the module
   *  - introduce requests and executors, based on options and contexts
   *  - this is run once all modules are registered
   */
  init?(
    context: {
      /**
       * path to root of the project
       */
      cwd: string;
      /**
       * all other loaded modules
       */
      modules: Record<string, ScaffoldingModuleAbstract<any>>;
      // todo checked-in config, zod validated
      config?: z.infer<ConfigSchema>;
      // todo checked-in store, not validated
      store: Record<string, any>;
      // todo passed in arguments, zod validated
      arguments: Record<string, any>;
    },
    plugins: {
      // ts-morph instance, applied at end of executions
      tsMorphProject: Project;
      logger: ScaffoldingModuleLogger;
    },
  ): Promise<void>;

  exec(
    context: {
      cwd: string;
      modules: Record<string, ScaffoldingModuleAbstract<any>>;
      config?: z.infer<ConfigSchema>;
      store: Record<string, any>;
      arguments: Record<string, any>;
    },
    plugins: {
      tsMorphProject: Project;
      logger: ScaffoldingModuleLogger;
    },
  ): Promise<{
    // todo, check-in
    store?: Record<string, any>;
  }>;
}

/**
 * An executor, exposed by ScaffoldingModules
 *  - can be dynamically enabled and modified by the ScaffoldingModule
 *     based on the context
 *  - can allow requesting modules to execute by setting exec
 */
export interface ScaffoldingExecutor {
  /**
   * Human-readable description
   *  todo, use in UI
   */
  description?: string;

  /**
   * What requests this executor can handle
   *  requests can ask for this module in specific or
   *  match by any other key-value
   */
  match: Record<string, any> & { module?: string };

  /**
   * Optional executor instance init
   *  - should not have any side effects
   */
  init?: (
    context: {
      /**
       * scaffolding request instance
       */
      request: ScaffoldingRequest;
    },
    plugins: {
      tsMorphProject: Project;
      logger: ScaffoldingModuleLogger;
    },
    // response stub
    response: {
      disabled?: boolean;
      state?: Record<string, any>;
    },
  ) => Promise<{
    /**
     * disable this executor instance
     *  preventing it from running
     */
    disabled?: boolean;

    /**
     * executor instance state, passed to the executor
     */
    state?: Record<string, any>;
  }>;

  /**
   * Optional executor instance run step
   *  - executor modules can also execute themselves
   *  - plugins can be executed by the ScaffoldingHandler
   */
  exec?: (
    context: {
      request: ScaffoldingRequest;
      // executor instance state
      state?: Record<string, any>;
    },
    plugins: {
      tsMorphProject: Project;
      logger: ScaffoldingModuleLogger;
    },
  ) => Promise<void>;
}

/**
 * Request a certain state from a module
 */
export interface ScaffoldingRequest {
  /**
   * requesting module
   */
  module?: ScaffoldingModuleAbstract<any>;

  /**
   * Human-readable description
   *  todo, use in UI
   */
  description?: string;

  /**
   * Match executors by this pattern
   */
  match: Record<string, any> & { module?: string };

  /**
   * Values to be used in the executors
   */
  values: any;

  /**
   * Optional requests do not raise en exception if a match is not found
   */
  optional?: boolean;

  /**
   * Executor to be used for this request
   */
  executors?: {
    /**
     * Disable this executor instance
     *  preventing it from running
     */
    disabled: boolean;

    context: {
      /**
       * state passed in from the executor instance init
       */
      state?: Record<string, any>;
    };
    executor: ScaffoldingExecutor;
  }[];
}
