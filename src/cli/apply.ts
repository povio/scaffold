import { z } from 'zod';
import { getArgs } from '../core/helpers/args';
import { keypress } from '../core/helpers/keypress';
import { TsMorphModule } from '../core/modules/ts-morph.module';
import { findScaffoldFiles } from '../core/scaffolding-finder';
import { Handler } from '../core/scaffolding-handler';
import { scaffoldingLogger } from '../core/scaffolding-logger';

const schema = z.object({
  cwd: z.nullable(z.optional(z.string())).default(process.cwd()),
  verbose: z.nullable(z.optional(z.boolean())),
  debug: z.nullable(z.optional(z.boolean())),
  yes: z.nullable(z.optional(z.boolean())),
});

export async function applyCommand(argv: string[]) {
  let args;
  try {
    args = getArgs(argv, {
      config: schema,
      envs: {},
    });
    await applyCommandHelper(args);
  } catch (error: any) {
    if (error.name === '$ZodError') {
      console.error(z.prettifyError(error));
    } else {
      console.error(`✖ ${error.message || error.toString()}`);
    }
    if (args?.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Apply a configuration
 */
export async function applyCommandHelper(args: {
  cwd?: string | null;
  yes?: boolean | null;
  debug?: boolean | null;
  verbose?: boolean | null;
}) {
  try {
    const cwd = args.cwd as string;
    const debug = args.debug as boolean;
    const verbose = args.verbose as boolean;
    const yes = args.yes as boolean;

    const sh = new Handler(cwd, scaffoldingLogger({ verbose, debug }));

    // build in modules
    sh.register(TsMorphModule);

    for await (const module of findScaffoldFiles({ cwd })) {
      sh.register(module);
    }

    // load all modules
    await sh.init();

    if (sh.status === 'queued') {
      console.log(`Press any key to execute ${sh.tasks.filter((x) => x.status === 'queued').length} tasks:`);
      if (!yes) await keypress();
      await sh.exec();
      process.exit(0);
    } else {
      console.log('No tasks to execute');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
