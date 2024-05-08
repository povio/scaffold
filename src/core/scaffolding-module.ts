import { debug as _debug } from 'debug';
import type { Project } from 'ts-morph';
import { z } from 'zod';

import {
  type ScaffoldingExecutor,
  type ScaffoldingModuleAbstract,
  type ScaffoldingModuleLogger,
  type ScaffoldingRequest,
} from './scaffolding.interfaces';

const debug = _debug('scaffold:module');

/**
 * Define a scaffold module
 *
 * todo, Options are stored in the 'scaffold.lock' file and are available to the module function
 *  at initialization.
 *
 * Based on the options, the module exposes a set of actions and a set of executors to run the actions.
 *
 * The orchestrator will run the actions and executors in the correct order, store the configuration and a journal
 *  of the actions and executors that were run.
 *
 */
export class ScaffoldingModule<Schema extends z.ZodObject<any, any, any> = z.ZodObject<any, any, any>>
  implements ScaffoldingModuleAbstract<Schema>
{
  public version: string = '1.0.0';
  public priority: number = 50;
  public enabled = true;
  public configSchema?: Schema;

  constructor(
    public name?: string,
    public requests: ScaffoldingRequest[] = [],
    public executors: ScaffoldingExecutor[] = [],
  ) {}

  /**
   * Execute the module requests
   *  by default, this will execute all the requests, made by this module in order of creation
   *  when the order is important, or there are additional tasks, you can extend this class
   *
   *  ScaffoldingModuleAbstract.exec
   */
  public async exec(
    context: {
      cwd: string;
      modules: Record<string, ScaffoldingModuleAbstract<any>>;
      config: z.infer<Schema>;
      store: Record<string, any>;
      arguments: Record<string, any>;
    },
    plugins: {
      tsMorphProject: Project;
      logger: ScaffoldingModuleLogger;
    },
  ) {
    for await (const request of this.requests) {
      if (!request.executors || request.executors.length < 1) {
        continue;
      }
      for (const ex of request.executors) {
        if (!ex.executor.exec) {
          continue;
        }
        debug(
          `execute ${this.name} -> ${ex.executor.match.module} ${ex.executor.description ? ` -> ${ex.executor.description}` : ''}`,
        );
        /**
         * ScaffoldingExecutor.exec
         */
        await ex.executor.exec(
          {
            request,
            state: ex.context.state,
          },
          plugins,
        );
      }
    }
    return {
      // store
    };
  }
}
