import type { Project } from 'ts-morph';
import type { z } from 'zod';

import { ScaffoldingHandler } from './scaffolding-handler';
import { type Executor, type Module, type Request, Task } from './scaffolding.classes';

type Optional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type IZod = z.ZodObject<any, any, any>;

export type IRequest = Partial<Omit<Request, 'tasks' | 'status'>> & { match: string };

export type IMessageAdd = (type: IMessage['type'], message: string, error?: Error) => IMessage;

export type IExecutorParams = (
  task: Task,
  actions: {
    addMessage: IMessageAdd;
    withTsMorph: (func: (context: { project: Project }) => Promise<void>) => Promise<void>;
  },
) => Promise<void>;

export type IExecutor = Omit<
  Optional<Executor, 'priority' | 'exception'>,
  'module' | 'runExec' | 'runInit' | 'init' | 'exec'
> & {
  init?: IExecutorParams;
  exec?: IExecutorParams;
};

export type ITask = Partial<Omit<Task, 'executor' | 'request' | 'status' | 'runExec' | 'runInit' | 'addMessage'>>;

export type IModuleInit<ConfigSchema extends IZod> = (
  context: {
    // Path to root of the project
    cwd: string;
    // All registered modules and their configs
    modules: Record<string, Module<any>>;
    // Zod-validated config
    config?: z.infer<ConfigSchema>;
  },
  actions: {
    addRequest: (request: IRequest) => Promise<IRequest>;
    addExecutor: (executor: IExecutor) => Promise<IExecutor>;
    setStatus: (status: Module<any>['status']) => void;
    addMessage: IMessageAdd;
  },
) => Promise<void>;

/**
 * Container for executors and requests
 */
export type IModule<ConfigSchema extends IZod> = Omit<
  Optional<Module<ConfigSchema>, 'messages' | 'config' | 'status' | 'version'>,
  'requests' | 'executors' | 'tasks' | 'type' | 'runInit' | 'initConfig' | 'addMessage'
> & {
  init?: IModuleInit<ConfigSchema>;
  requests?: IRequest[];
  executors?: IExecutor[];
  type?: 'module-stub';
};

export interface IMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  error?: Error;
}

export type IEventHandler = (
  event: 'register' | 'init' | 'configure' | 'status' | 'message',
  source: Module<any> | Request | Executor | Task | IHandler,
  data?: any,
) => void;

export interface IHandler extends ScaffoldingHandler {}
