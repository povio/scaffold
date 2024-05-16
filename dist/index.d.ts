import { Project } from 'ts-morph';
import { z } from 'zod';

type ScaffoldingModuleLogger = (level: 'info' | 'warn' | 'error', message: string, context?: string) => void;
interface ScaffoldingModuleAbstract<ConfigSchema extends z.ZodObject<any, any, any>> {
    name?: string;
    enabled: boolean;
    priority: number;
    requests: ScaffoldingRequest[];
    executors: ScaffoldingExecutor[];
    configSchema?: ConfigSchema;
    config?: Record<string, any>;
    init?(context: {
        cwd: string;
        modules: Record<string, ScaffoldingModuleAbstract<any>>;
        config?: z.infer<ConfigSchema>;
        store: Record<string, any>;
        arguments: Record<string, any>;
    }, plugins: {
        tsMorphProject: Project;
        logger: ScaffoldingModuleLogger;
    }): Promise<void>;
    exec(context: {
        cwd: string;
        modules: Record<string, ScaffoldingModuleAbstract<any>>;
        config?: z.infer<ConfigSchema>;
        store: Record<string, any>;
        arguments: Record<string, any>;
    }, plugins: {
        tsMorphProject: Project;
        logger: ScaffoldingModuleLogger;
    }): Promise<{
        store?: Record<string, any>;
    }>;
}
interface ScaffoldingExecutor {
    description?: string;
    match: Record<string, any> & {
        module?: string;
    };
    init?: (context: {
        request: ScaffoldingRequest;
    }, plugins: {
        tsMorphProject: Project;
        logger: ScaffoldingModuleLogger;
    }, response: {
        disabled?: boolean;
        state?: Record<string, any>;
    }) => Promise<{
        disabled?: boolean;
        state?: Record<string, any>;
    }>;
    exec?: (context: {
        request: ScaffoldingRequest;
        state?: Record<string, any>;
    }, plugins: {
        tsMorphProject: Project;
        logger: ScaffoldingModuleLogger;
    }) => Promise<void>;
}
interface ScaffoldingRequest {
    module?: ScaffoldingModuleAbstract<any>;
    description?: string;
    match: Record<string, any> & {
        module?: string;
    };
    values: any;
    optional?: boolean;
    executors?: {
        disabled: boolean;
        context: {
            state?: Record<string, any>;
        };
        executor: ScaffoldingExecutor;
    }[];
}

declare class ScaffoldingModule<Schema extends z.ZodObject<any, any, any> = z.ZodObject<any, any, any>> implements ScaffoldingModuleAbstract<Schema> {
    name?: string | undefined;
    requests: ScaffoldingRequest[];
    executors: ScaffoldingExecutor[];
    version: string;
    priority: number;
    enabled: boolean;
    configSchema?: Schema;
    config?: z.infer<Schema>;
    constructor(name?: string | undefined, requests?: ScaffoldingRequest[], executors?: ScaffoldingExecutor[]);
    exec(context: {
        cwd: string;
        modules: Record<string, ScaffoldingModuleAbstract<any>>;
        config: z.infer<Schema>;
        store: Record<string, any>;
        arguments: Record<string, any>;
    }, plugins: {
        tsMorphProject: Project;
        logger: ScaffoldingModuleLogger;
    }): Promise<{}>;
}

declare class ScaffoldingHandler {
    readonly cwd: string;
    readonly tsMorphProject: Project;
    readonly modulesDict: Record<string, ScaffoldingModuleAbstract<any>>;
    readonly executors: ScaffoldingExecutor[];
    readonly rawConfig: Record<string, any>;
    readonly config: Record<string, any>;
    logger(level: 'info' | 'warn' | 'error', message: string, context?: string): void;
    constructor(cwd?: string);
    register(module: ScaffoldingModuleAbstract<any>): void;
    init(): Promise<void>;
    exec(): Promise<void>;
    reset(): void;
}

declare function findScaffoldFiles<SM extends ScaffoldingModule>(context: {
    cwd: string;
}): AsyncGenerator<SM>;

export { type ScaffoldingExecutor, ScaffoldingHandler, ScaffoldingModule, type ScaffoldingModuleAbstract, type ScaffoldingModuleLogger, type ScaffoldingRequest, findScaffoldFiles };
