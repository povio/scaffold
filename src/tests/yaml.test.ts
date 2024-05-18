import { test } from 'node:test';
import { parseDocument, isCollection, type Document } from 'yaml';

import { ScaffoldingHandler } from '../core/scaffolding-handler';
import { ScaffoldingModule, scaffolding } from '../core/scaffolding-module';

test('yarn scaffold', async () => {
  const files: Record<
    string,
    {
      save?: boolean;
      content: string;
      yaml?: Document.Parsed;
    }
  > = {
    'arrays.yml': {
      content: `
example:
 - one: 1
 - two: 2
      `,
    },
    'objects.yml': {
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
  function get(name: string) {
    if (!files[name]) {
      files[name] = { save: false, content: '' };
    }
    if (!files[name].yaml) {
      files[name].yaml = parseDocument(files[name].content, {
        prettyErrors: true,
        merge: true,
        keepSourceTokens: true,
      });
    }
    return files[name];
  }

  const sh = new ScaffoldingHandler();

  const sc1 = scaffolding({
    name: 'config',

    init: async ({ cwd }, { addExecutor, addRequest }) => {
      addExecutor({}, async (request, response) => {
        const { value, stage, moduleName, state } = request.value;

        if (!stage || !moduleName || !state || !value) {
          response.status = 'invalid';
          response.description = `stage, moduleName, value, and state are required for dot-config creation`;
          return response;
        }

        if (stage === '[all]' || stage === '[deployed]') {
          const stages = new Set();
          if (stage === '[deployed]') {
            stages.delete('local');
          }
          for (const s in stages.keys()) {
            addRequest(
              {
                match: 'dot-config',
                value: { ...request.value, stage: s },
              },
              {
                description: `expand into ${s}`,
                request,
              },
            );
          }
          response.status = 'hidden';
          response.description = `queued ${stage} dot-config`;
          return response;
        }

        const file = get(cwd, moduleName, stage);
        const description = [];
        response.status = 'valid';
        switch (state) {
          case 'created':
            for (const [k, v] of Object.entries(value)) {
              if (!file.yaml.has(k)) {
                file.yaml.addIn([k], v);
                file.save = true;
                description.push(`${file.name} => create ${k} section`);
                response.status = 'queued';
              }
            }
            break;
          case 'subset':
            // this is a really dumb implementation
            //  we should be able to set a subset of the yaml recursively
            for (const [section, sectionValue] of Object.entries(value)) {
              if (!file.yaml.has(section)) {
                file.yaml.set(section, sectionValue);
                file.save = true;
                description.push(`${file.name} => create ${section} section`);
                response.status = 'queued';
              } else {
                const sectionNode = file.yaml.get(section);
                if (!isCollection(sectionNode)) {
                  response.status = 'invalid';
                  response.description = `${file.name} => expected section ${section} to be a collection`;
                  return response;
                }
                for (const [sectionItem, v] of Object.entries(sectionValue)) {
                  if (!sectionNode.has(sectionItem) || sectionNode.get(sectionItem) !== v) {
                    sectionNode.setIn([sectionItem], v);
                    file.save = true;
                    description.push(`${file.name} => update ${section}.${sectionItem} to ${v}`);
                    response.status = 'queued';
                  }
                }
              }
            }
            break;
        }
        response.description = description.join('\n');
        return response;
      });
    },

    exec: async ({ cwd }) => {
      Object.values(files)
        .filter((f) => f.save)
        .forEach(({ path, yaml }) => writeFileSync(path, yaml.toString()));
    },
  });

  sh.register(sc1);
  sh.register(
    new ScaffoldingModule('need-stuff-done', [{ match: { state: 'stuff-done' }, values: { thing: 'that' } }]),
  );

  await sh.init();
  await sh.exec();
});
