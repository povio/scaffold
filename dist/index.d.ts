import { Project } from 'ts-morph';
import { z } from 'zod';

declare class ScaffoldingHandler {
    readonly cwd: string;
    private readonly onEvent;
    readonly modulesDict: Record<string, IModule<any>>;
    readonly moduleStubDict: Record<string, IModuleStub<any>>;
    readonly rawConfig: Record<string, any>;
    readonly executors: IExecutor[];
    readonly tasks: ITask[];
    readonly tsMorphProject: Project;
    status: 'uninitialized' | 'configuring' | 'loading-executors' | 'loading-tasks' | 'prepared' | 'executing' | 'done' | 'error';
    constructor(cwd?: string, onEvent?: IEventHandler);
    register<ConfigSchema extends z.ZodObject<any, any, any>>(module: IModuleStub<ConfigSchema>): IModuleStub<ConfigSchema>;
    init(): Promise<void>;
    exec(): Promise<void>;
    readonly type: "handler";
}
declare function createScaffolding<ConfigSchema extends z.ZodObject<any, any, any>>(data: IModuleStub<ConfigSchema>): IModuleStub<ConfigSchema>;

interface IRequest {
    module: IModule<any>;
    description?: string;
    match: string;
    value?: Record<string, any>;
    optional?: boolean;
    priority: number;
    status: 'uninitialised' | 'initialised' | 'error' | 'disabled';
    messages: IMessage[];
    tasks: ITask[];
    type: 'request';
}
interface ITask extends ITaskContext {
    executor: IExecutor;
    request: IRequest;
    type: 'task';
}
interface IExecutor {
    description?: string;
    match: string;
    priority: number;
    init?: (task: ITask, actions: {
        addMessage: (type: 'error' | 'warning' | 'info', message: string, error?: Error) => IMessage;
        withTsMorph: (func: (context: {
            project: Project;
        }) => Promise<void>) => Promise<void>;
    }) => Promise<void>;
    exception: 'ignore' | 'throw';
    exec?: (task: ITask, actions: {
        addMessage: (type: 'error' | 'warning' | 'info', message: string, error?: Error) => IMessage;
        withTsMorph: (func: (context: {
            project: Project;
        }) => Promise<void>) => Promise<void>;
    }) => Promise<void>;
    module: IModule<any>;
    type: 'executor';
}
interface ITaskContext {
    status: 'disabled' | 'uninitialised' | 'queued' | 'invalid' | 'completed' | 'error';
    messages: IMessage[];
    priority: number;
    data?: Record<string, any>;
}
interface IModule<ConfigSchema extends z.ZodObject<any, any, any>> {
    name: string;
    version?: string;
    description?: string;
    status: 'uninitialised' | 'queued' | 'disabled' | 'invalid' | 'completed' | 'error';
    messages: IMessage[];
    requests: IRequest[];
    executors: IExecutor[];
    tasks: ITask[];
    configSchema?: ConfigSchema;
    config?: Record<string, any>;
    init?: IModuleInit<ConfigSchema>;
    type: 'module';
}
type IModuleInit<ConfigSchema extends z.ZodObject<any, any, any>> = (context: {
    cwd: string;
    modules: Record<string, IModuleStub<any>>;
    config?: z.infer<ConfigSchema>;
}, actions: {
    addRequest: (request: Partial<IRequest> & {
        match: string;
    }) => Promise<IRequest>;
    addExecutor: (executor: Partial<IExecutor> & {
        match: string;
    }) => Promise<IExecutor>;
    setStatus: (status: IModule<any>['status']) => void;
    addMessage: (type: 'error' | 'warning' | 'info', message: string, error?: Error) => IMessage;
}) => Promise<void>;
type Optional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
type IModuleStub<ConfigSchema extends z.ZodObject<any, any, any>> = Omit<Optional<IModule<ConfigSchema>, 'messages' | 'config' | 'status'>, 'requests' | 'executors' | 'tasks' | 'type'> & {
    requests?: Array<Partial<IRequest> & {
        match: string;
    }>;
    executors?: Array<Partial<IExecutor> & {
        match: string;
    }>;
    type?: 'module-stub';
};
interface IMessage {
    type: 'error' | 'warning' | 'info';
    message: string;
    error?: Error;
}
type IEventHandler = (source: IModuleStub<any> | IModule<any> | IRequest | IExecutor | ITask | ScaffoldingHandler, event: string, data?: any) => void;

declare function findScaffoldFiles<SM extends IModuleStub<any>>(context: {
    cwd: string;
}): AsyncGenerator<SM>;

export { type IEventHandler, type IExecutor, type IMessage, type IModule, type IModuleInit, type IModuleStub, type IRequest, type ITask, ScaffoldingHandler, createScaffolding, findScaffoldFiles };
