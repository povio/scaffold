import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { test, afterEach } from 'node:test';

import { ScaffoldingHandler } from '../core/scaffolding-handler';
import { ScaffoldingModule } from '../core/scaffolding-module';

const filePath = join(__dirname, `ts-morph.test.${Math.random()}.ts`);

export class TsMorphTestModule extends ScaffoldingModule {
  name = 'ts-morph-test';

  async init() {
    this.executors = [
      {
        match: { state: 'stuff-done' },
        init: async ({ request: { values } }, { tsMorphProject }) => {
          tsMorphProject.createSourceFile(filePath, `console.log("${values.thing}");`);
          return {};
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
