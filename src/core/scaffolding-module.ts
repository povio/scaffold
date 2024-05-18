import { z } from 'zod';

import { type IModule } from './scaffolding.interfaces';

/**
 * Define a scaffold module
 *  - and its actions
 *
 * The orchestrator will run the actions and executors in the correct order.
 *
 */
export function scaffolding<ConfigSchema extends z.ZodObject<any, any, any>>(
  module: Pick<
    Partial<IModule<ConfigSchema>>,
    'name' | 'version' | 'description' | 'requests' | 'executors' | 'configSchema' | 'init'
  >,
): IModule<ConfigSchema> {
  return {
    status: 'uninitialised',
    version: '1.0.0',
    requests: [],
    executors: [],
    tasks: [],
    ...module,
  };
}
