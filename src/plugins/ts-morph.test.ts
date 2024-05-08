import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { test, afterEach } from 'node:test';
import { z } from 'zod';

import { ScaffoldingHandler } from '../core/scaffolding-handler';
import { ScaffoldingModule } from '../core/scaffolding-module';

const filePath = join(__dirname, `ts-morph.test.${Math.random()}.ts`);

const configSchema = z.object({
  thing: z.string(),
});

export class TsMorphTestModule extends ScaffoldingModule {
  name = 'ts-morph-test';

  configSchema = configSchema;

  init({ config }: { config: z.infer<typeof configSchema> }) {
    this.executors = [
      {
        match: { state: 'stuff-done' },
        init: async ({ request: { values } }, { tsMorphProject, logger }, response) => {
          logger('info', `from config ${config.thing}`);
          tsMorphProject.createSourceFile(filePath, `console.log("${values.thing} ${config.thing}");`);
          return response;
        },
      },
    ];
  }

  // no need to execute, tsMorphProject will be executed in the plugin
}

afterEach(() => {
  unlinkSync(filePath);
});

test('ts-morph scaffold', async () => {
  const sh = new ScaffoldingHandler();

  sh.register(new TsMorphTestModule());
  sh.register(
    new ScaffoldingModule('need-stuff-done', [{ match: { state: 'stuff-done' }, values: { thing: 'that' } }]),
  );

  await sh.init();
  await sh.exec();
});
