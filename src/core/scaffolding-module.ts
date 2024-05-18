import { z } from 'zod';

import { type IExecutor, type IModule, type IModuleInit, type IRequest } from './scaffolding.interfaces';

/**
 * Define a scaffold module
 *  - and its actions
 *
 * The orchestrator will run the actions and executors in the correct order.
 *
 */
export function scaffolding<ConfigSchema extends z.ZodObject<any, any, any>>(module: {
  // Globally unique name
  name: string;

  // Semantic version of the module
  version?: string;

  // Human-readable description of the module
  description?: string;

  /**
   * Zod config schema
   *  validated before init
   */
  configSchema?: ConfigSchema;

  // Module initializer
  init?: IModuleInit<ConfigSchema>;

  // Executors provided by this module
  executors?: Array<Partial<IExecutor> & { match: string }>;

  // Requests made by this module
  requests?: Array<Partial<IRequest> & { match: string }>;
}): IModule<ConfigSchema> {
  if (module.init && (module.requests || module.executors)) {
    throw new Error('init cannot be defined with requests or executors');
  }

  let init = module.init;

  if (!init && (module.requests || module.executors)) {
    init = async (_, { addRequest, addExecutor }) => {
      for (const request of module.requests || []) {
        await addRequest(request);
      }
      for (const executor of module.executors || []) {
        await addExecutor(executor);
      }
    };
  }

  return {
    status: 'uninitialised',
    version: '1.0.0',
    tasks: [],
    ...module,
    executors: [],
    requests: [],
    init,
  };
}
