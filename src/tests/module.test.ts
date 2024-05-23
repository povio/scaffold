import { test } from 'node:test';
import { parseDocument, isCollection, type Document } from 'yaml';

import { Handler } from '../core/scaffolding-handler';
import { scaffoldingLogger } from '../core/scaffolding-logger';
import { IModule } from '../core/scaffolding.interfaces';

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
      files[name].yaml = parseDocument(files[name].content || '', {
        prettyErrors: true,
        merge: true,
        keepSourceTokens: true,
      });
    }
    return files[name] as any;
  }

  const sh = new Handler(undefined, scaffoldingLogger);

  const sc1: IModule<any> = {
    name: 'an-config-module',
    init: async (_, { addExecutor, addRequest, addMessage }) => {
      await addExecutor({
        match: 'an-config-module',
        description: 'prepare dot-config file changes',
        priority: 50,
        init: async (task) => {
          if (!task.request.value) {
            throw new Error('value is required');
          }
          const { state, stage, value: _value } = task.request.value;
          if (!stage || !state || !_value) {
            task.status = 'error';
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
                description: `propagating ${stage} to ${s} dot-config`,
                value: { ...task.request.value, stage: s },
                module: task.request.module, // override module
              });
            }
            task.status = 'completed';
            addMessage('info', `queued ${stage} dot-config for all stages`);
            return;
          }
          const file = get(`${stage}.app.template.yml`);
          const message = [];
          switch (state) {
            case 'created': {
              for (const [k, v] of Object.entries(value)) {
                if (!file.yaml?.has(k)) {
                  file.yaml.addIn([k], v);
                  file.save = true;
                  message.push(`create ${k} section`);
                }
              }
              break;
            }
            case 'subset': {
              // this is a really dumb implementation
              //  we should be able to set a subset of the yaml recursively
              for (const [section, sectionValue] of Object.entries(value)) {
                if (!file.yaml.has(section)) {
                  file.yaml.set(section, sectionValue);
                  file.save = true;
                  message.push(`create ${section} section`);
                } else {
                  const sectionNode = file.yaml.get(section);
                  if (!isCollection(sectionNode)) {
                    task.status = 'error';
                    addMessage('error', `expected section ${section} to be a collection`);
                    return;
                  }
                  for (const [sectionItem, v] of Object.entries(sectionValue)) {
                    if (!sectionNode.has(sectionItem) || sectionNode.get(sectionItem) !== v) {
                      sectionNode.setIn([sectionItem], v);
                      file.save = true;
                      message.push(`update ${section}.${sectionItem} to ${v}`);
                    }
                  }
                }
              }
              break;
            }
          }
          return;
        },
      });

      await addExecutor({
        match: 'an-config-module:#after-all',
        description: 'save dot-config files',
        init: async (task) => {
          // check if we need to update the files
          if (!Object.values(files).some((f) => f.save)) {
            task.status = 'disabled';
          }
        },
        exec: async () => {
          // update the files
          addMessage('info', 'updating dot-config files');
        },
      });
    },
  };

  sh.register(sc1);

  sh.register({
    name: 'need-stuff-done',
    requests: [
      {
        description: 'create an_object section or just add key3',
        priority: 15, // higher priority to capture the [all] stage
        match: 'an-config-module',
        value: { state: 'subset', stage: '[all]', value: { an_object: { key3: 'value3' } } },
      },
    ],
  });

  sh.register({
    name: 'need-stuff-done-too',
    requests: [
      {
        priority: 10,
        match: 'an-config-module',
        value: { state: 'subset', stage: 'myapp-prd', value: { another_object: { keyB: 'valueC' } } },
      },
    ],
  });

  await sh.init();
  await sh.exec();
});
