import { Project } from 'ts-morph';
import * as tsMorph from 'ts-morph';
export { tsMorph };
import * as semver from 'semver';
export { semver };
import * as zod from 'zod';
export { zod };

type ScaffoldingModuleLogger = (level: 'info' | 'warn' | 'error', message: string, context?: string) => void;
interface ScaffoldingModuleAbstract {
    name?: string;
    enabled: boolean;
    priority: number;
    requests: ScaffoldingRequest[];
    executors: ScaffoldingExecutor[];
    init?(context: {
        cwd: string;
        modules: Record<string, ScaffoldingModuleAbstract>;
        config: Record<string, any>;
        store: Record<string, any>;
        arguments: Record<string, any>;
    }, plugins: {
        tsMorphProject: Project;
        logger: ScaffoldingModuleLogger;
    }): Promise<void>;
    exec(context: {
        cwd: string;
        modules: Record<string, ScaffoldingModuleAbstract>;
        config: Record<string, any>;
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
    module?: ScaffoldingModuleAbstract;
    description?: string;
    match: Record<string, any> & {
        module?: string;
    };
    values: any;
    optional?: boolean;
    executors?: {
        context: {
            state?: Record<string, any>;
        };
        executor: ScaffoldingExecutor;
    }[];
}

declare class ScaffoldingModule implements ScaffoldingModuleAbstract {
    name?: string | undefined;
    requests: ScaffoldingRequest[];
    executors: ScaffoldingExecutor[];
    version: string;
    priority: number;
    enabled: boolean;
    constructor(name?: string | undefined, requests?: ScaffoldingRequest[], executors?: ScaffoldingExecutor[]);
    exec(context: {
        cwd: string;
        modules: Record<string, ScaffoldingModuleAbstract>;
        config: Record<string, any>;
        store: Record<string, any>;
        arguments: Record<string, any>;
    }, plugins: {
        tsMorphProject: Project;
        logger: ScaffoldingModuleLogger;
    }): Promise<{}>;
}

declare class ScaffoldingHandler<SM extends ScaffoldingModuleAbstract> {
    readonly cwd: string;
    readonly tsMorphProject: Project;
    readonly modulesDict: Record<string, SM>;
    readonly executors: ScaffoldingExecutor[];
    logger(level: 'info' | 'warn' | 'error', message: string, context?: string): void;
    constructor(cwd?: string);
    register(module: SM): void;
    init(): Promise<void>;
    exec(): Promise<void>;
    reset(): void;
}

declare function findScaffoldFiles<SM extends ScaffoldingModule>(context: {
    cwd: string;
}): AsyncGenerator<SM>;

export { type ScaffoldingExecutor, ScaffoldingHandler, ScaffoldingModule, type ScaffoldingModuleAbstract, type ScaffoldingModuleLogger, type ScaffoldingRequest, findScaffoldFiles };
