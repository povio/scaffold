import { Project } from 'ts-morph';
import { z } from 'zod';

declare class Module<ConfigSchema extends IZod> implements Observable {
    private handler;
    constructor(props: Omit<IModule<ConfigSchema>, 'addRequest'>, handler: IHandler);
    get id(): string;
    readonly name: string;
    readonly version: string;
    readonly description?: string;
    private _status;
    get status(): IStatus;
    set status(status: IStatus);
    messages: IMessage[];
    addMessage(type: IMessage['type'], message: string, error?: Error): {
        type: "error" | "warning" | "info";
        message: string;
        error: Error | undefined;
        status: IStatus;
    };
    private readonly _requests;
    private readonly _executors;
    requests: Request[];
    executors: Executor[];
    tasks: ITask[];
    readonly configSchema?: ConfigSchema;
    config?: Record<string, any>;
    initConfig(config: Record<string, any>): Promise<void>;
    runInit(config: Parameters<IModuleInit<ConfigSchema>>[0], _plugins: Omit<Parameters<IModuleInit<ConfigSchema>>[1], 'addMessage' | 'setStatus'>): Promise<void>;
    private readonly _init?;
    exception: 'ignore' | 'throw';
}
declare class Request implements Observable {
    private handler;
    constructor(props: IRequest, module: Module<any>, handler: IHandler);
    readonly id: string;
    module: Module<any>;
    _description?: string;
    get description(): string;
    set description(description: string);
    match: string;
    value?: Record<string, any>;
    optional?: boolean;
    priority: number;
    private _status;
    get status(): IStatus;
    set status(status: IStatus);
    addMessage(type: IMessage['type'], message: string, error?: Error): {
        type: "error" | "warning" | "info";
        message: string;
        error: Error | undefined;
        status: IStatus;
    };
    messages: IMessage[];
    tasks: Task[];
}
declare class Executor implements Observable {
    module: Module<any>;
    private handler;
    constructor(props: IExecutor, module: Module<any>, handler: IHandler);
    readonly id: string;
    description?: string;
    match: string;
    priority: number;
    get init(): IExecutorParams | undefined;
    private readonly _init?;
    exception: 'ignore' | 'throw';
    get exec(): IExecutorParams | undefined;
    readonly status: IStatus;
    private readonly _exec?;
}
declare class Task implements Observable {
    private handler;
    executor: Executor;
    request: Request;
    constructor(params: ITask, handler: IHandler, executor: Executor, request: Request);
    readonly id: string;
    get description(): string;
    set description(description: string);
    private _description?;
    runInit(actions: Omit<Parameters<IExecutorParams>[1], 'addMessage'>): Promise<void>;
    runExec(actions: Omit<Parameters<IExecutorParams>[1], 'addMessage'>): Promise<void>;
    private _status;
    get status(): IStatus;
    set status(status: IStatus);
    messages: IMessage[];
    addMessage(type: IMessage['type'], message: string, error?: Error): {
        type: "error" | "warning" | "info";
        message: string;
        error: Error | undefined;
        status: IStatus;
    };
    priority: number;
    data?: Record<string, any>;
}

declare class Handler implements Observable {
    readonly cwd: string;
    readonly onEvent: IEventHandler;
    readonly modulesDict: Record<string, Module<any>>;
    readonly rawConfig: Record<string, any>;
    readonly executors: Executor[];
    private readonly requestQueue;
    readonly tasks: Task[];
    readonly tsMorphProject: Project;
    private step;
    private _status;
    description: string;
    constructor(cwd?: string, onEvent?: IEventHandler);
    register<ConfigSchema extends IZod>(module: IModule<ConfigSchema>): IModule<ConfigSchema>;
    registerRequest(_request: IRequest, module: Module<any>): Promise<Request>;
    registerExecutor(_executor: IExecutor, module: Module<any>): Promise<Executor>;
    initTasks(request: Request): Promise<Request>;
    private set status(value);
    get status(): IStatus;
    init(): Promise<void>;
    exec(): Promise<void>;
    ids: Record<string, number>;
    makeId(namespace: string): string;
    get id(): string;
}
declare function createScaffolding<ConfigSchema extends IZod>(data: IModule<ConfigSchema>): IModule<ConfigSchema>;

type Optional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
type IZod = z.ZodObject<any, any, any>;
type IRequest = Partial<Omit<Request, 'tasks' | 'status' | 'id'>> & {
    match: string;
};
type IMessageAdd = (type: IMessage['type'], message: string, error?: Error) => IMessage;
type IExecutorParams = (task: Task, actions: {
    addMessage: IMessageAdd;
    withTsMorph: (func: (context: {
        project: Project;
    }) => Promise<void>) => Promise<void>;
}) => Promise<void>;
type IExecutor = Omit<Optional<Executor, 'priority' | 'exception'>, 'module' | 'runExec' | 'runInit' | 'init' | 'exec' | 'status' | 'id'> & {
    init?: IExecutorParams;
    exec?: IExecutorParams;
};
type ITask = Partial<Omit<Task, 'executor' | 'request' | 'status' | 'runExec' | 'runInit' | 'addMessage' | 'id'>>;
type IModuleInit<ConfigSchema extends IZod> = (context: {
    cwd: string;
    modules: Record<string, Module<any>>;
    config?: z.infer<ConfigSchema>;
}, actions: {
    addRequest: (request: IRequest) => Promise<IRequest>;
    addExecutor: (executor: IExecutor) => Promise<IExecutor>;
    setStatus: (status: IStatus) => void;
    addMessage: IMessageAdd;
}) => Promise<void>;
type IModule<ConfigSchema extends IZod> = Omit<Optional<Module<ConfigSchema>, 'messages' | 'config' | 'status' | 'version' | 'id' | 'exception'>, 'requests' | 'executors' | 'tasks' | 'type' | 'runInit' | 'initConfig' | 'addMessage'> & {
    init?: IModuleInit<ConfigSchema>;
    requests?: IRequest[];
    executors?: IExecutor[];
    type?: 'module-stub';
};
interface IMessage {
    type: 'error' | 'warning' | 'info';
    message: string;
    error?: Error;
    status?: IStatus;
}
declare enum Status {
    registered = "registered",
    configured = "configured",
    uninitialized = "uninitialized",
    queued = "queued",
    delegated = "delegated",
    disabled = "disabled",
    conforming = "conforming",
    executed = "executed",
    errored = "errored"
}
type IStatus = keyof typeof Status | Status;
type IEventHandler = (event: IStatus | 'message', source: Module<any> | Request | Executor | Task | Handler, data?: any) => void;
interface IHandler extends Handler {
}
declare abstract class Observable {
    abstract status: IStatus | string;
    abstract readonly id: string;
    abstract readonly description?: string;
}

declare function findScaffoldFiles<SM extends IModule<any>>(context: {
    cwd: string;
}): AsyncGenerator<SM>;

export { Handler, type IEventHandler, type IExecutor, type IHandler, type IMessage, type IModule, type IModuleInit, type IRequest, type IStatus, type ITask, createScaffolding, findScaffoldFiles };
