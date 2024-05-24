import { test } from 'node:test';
import { parseDocument, type Document } from 'yaml';

import { Handler } from '../core/scaffolding-handler';
import { scaffoldingLogger } from '../core/scaffolding-logger';
import { IModule, Status } from '../core/scaffolding.interfaces';

test('yarn scaffold', async () => {
  const files: Record<
    string,
    {
      save?: boolean;
      content: string;
      yaml?: Document.Parsed;
    }
  > = {
    'myapp-dev.app.template.yml': {
      content: `
example:
 - one: 1
 - two: 2
      `,
    },
    'local.app.template.yml': {
      content: `
example:
 - one: 1
 - two: 2
      `,
    },
    'myapp-stg.app.template.yml': {
      content: `
an_object:
  key1: value1
  key2: value2
      `,
    },
  };

  /**
   * Get a dot-config file
   */
  function get(name: string): { save?: boolean; content: string; yaml: Document.Parsed } {
    if (!files[name]) {
      files[name] = { save: false, content: '' };
    }
    if (!files[name].yaml) {
      files[name].yaml = parseDocument(files[name].content || 'dummy: content', {
        prettyErrors: true,
        merge: true,
        keepSourceTokens: true,
      });
    }
    return files[name] as any;
  }

  const sh = new Handler(undefined, scaffoldingLogger({ verbose: false, debug: false }));

  const sc1: IModule<any> = {
    name: 'an-config-module',
    init: async (_, { addExecutor, addRequest }) => {
      await addExecutor({
        match: 'an-config-module',
        description: 'prepare dot-config file changes',
        priority: 50,
        init: async (task, { addMessage }) => {
          if (!task.request.value) {
            throw new Error('value is required');
          }
          const { state, stage, value: _value } = task.request.value;
          if (!stage || !state || !_value) {
            task.status = Status.errored;
            addMessage('error', `stage, value, and state are required for dot-config creation`);
            return;
          }
          const value = _value as Record<string, Record<string, any>>;
          if (stage === '[all]' || stage === '[deployed]') {
            const stages = new Set(Object.keys(files).map((f) => f.split('.')[0]));
            if (stage === '[deployed]') {
              stages.delete('local');
            }
            for (const s of [...stages.keys()]) {
              await addRequest({
                match: 'an-config-module',
                description: task.request.description,
                value: { ...task.request.value, stage: s },
                module: task.request.module, // override module
              });
            }
            task.status = Status.conforming;
            // addMessage('info', `queued ${stage} dot-config for all stages`);
            return;
          }
          const file = get(`${stage}.app.template.yml`);
          switch (state) {
            case 'created': {
              for (const [k, v] of Object.entries(value)) {
                if (!file.yaml.hasIn(k.split('.'))) {
                  file.yaml.addIn(k.split('.'), v);
                  file.save = true;
                  addMessage('info', `create "${k}" section in "${stage}"`);
                  task.status = Status.delegated;
                }
              }
              break;
            }
            default:
              throw new Error(`unsupported state: ${state}`);
          }
          return;
        },
      });

      await addExecutor({
        match: 'an-config-module:#after-all',
        description: 'save dot-config files',
        init: async (task, { addMessage }) => {
          // check if we need to update the files
          if (!Object.values(files).some((f) => f.save)) {
            task.status = Status.disabled;
            addMessage('info', 'no changes to save');
          }
          addMessage('info', 'saving changes');
          // task.status = Status.queued;
        },
        exec: async (task, { addMessage }) => {
          // update the files
          addMessage('info', 'updating dot-config files');
          // throw new Error('not implemented');
        },
      });
    },
  };

  sh.register(sc1);

  sh.register({
    name: 'need-stuff-done',
    requests: [
      {
        description: 'make sure an_object.key3 is present',
        priority: 15, // higher priority to capture the [all] stage
        match: 'an-config-module',
        value: { state: 'created', stage: '[all]', value: { 'an_object.key3': 'value3' } },
      },
    ],
  });

  sh.register({
    name: 'need-stuff-done-too',
    requests: [
      {
        priority: 10,
        description: 'create a new stage with another_object',
        match: 'an-config-module',
        value: { state: 'created', stage: 'myapp-prd', value: { another_object: { keyB: 'valueC' } } },
      },
    ],
  });

  await sh.init();
  await sh.exec();
});
