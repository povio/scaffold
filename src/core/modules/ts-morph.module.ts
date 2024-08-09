import { spawn } from 'node:child_process';
import { join, relative } from 'node:path';
import { Project as TsMorphProject } from 'ts-morph';
import { z } from 'zod';

import { Module } from '../scaffolding.classes';
import { IExecutor, IHandler, type IModule } from '../scaffolding.interfaces';

const TsMorphConfig = z.object({
  tsConfigFilePath: z.string().default('tsconfig.json'),
  lint: z.string().default('yarn eslint --fix $modified'),
});

export class TsMorphModule extends Module<typeof TsMorphConfig> {
  constructor(
    protected handler: IHandler,
    props?: Omit<IModule<typeof TsMorphConfig>, 'addRequest'>,
  ) {
    super(handler, {
      name: 'ts-morph',
      configSchema: TsMorphConfig,
      ...props,
    });
  }

  private _project?: TsMorphProject;

  public async withTsMorph(func: (context: { project: TsMorphProject }) => Promise<void>) {
    if (!this._project) {
      this._project = new TsMorphProject({
        tsConfigFilePath: join(this.handler.cwd, this.config?.tsConfigFilePath ?? 'tsconfig.json'),
      });
    }
    return await func({ project: this._project });
  }

  _executors: IExecutor[] = [
    {
      match: 'ts-morph:#after-all',
      description: 'save file changes',
      init: async (task) => {
        if (this._project && this._project.getSourceFiles().some((f) => !f.isSaved())) {
          this.status = 'queued';
          return;
        }
        task.status = 'disabled';
      },
      exec: async (task, { addMessage }) => {
        if (this._project) {
          const modified = this._project
            .getSourceFiles()
            .filter((f) => !f.isSaved())
            .map((f) => f.getFilePath());
          if (modified.length > 0) {
            await this._project.save();
          }
          if (this.config?.lint) {
            const cwd = this.handler.cwd;
            const fullCommand = this.config.lint.replace('$modified', modified.map((x) => relative(cwd, x)).join(' '));
            addMessage('info', `running: ${fullCommand}`);
            const [command, ...args] = fullCommand.split(' ');
            await new Promise((resolve, reject) => {
              const install = spawn(command, args, { cwd });
              install.stdout.setEncoding('utf8').on('data', console.log);
              install.stderr.setEncoding('utf8').on('data', console.error);
              install.on('exit', resolve);
              install.on('error', reject);
            });
          }
        }
      },
      priority: 100, // Run last but allow tasks after this to be queued for linting etc.
    },
  ];
}
