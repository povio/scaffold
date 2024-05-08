export { ScaffoldingModule } from './core/scaffolding-module';
export {
  type ScaffoldingModuleAbstract,
  type ScaffoldingExecutor,
  type ScaffoldingRequest,
  type ScaffoldingModuleLogger,
} from './core/scaffolding.interfaces';

export { ScaffoldingHandler } from './core/scaffolding-handler';
export { findScaffoldFiles } from './core/scaffolding-finder';

/**
 * Plugins commonly used in scaffolding
 *  export them to enforce consistent usage
 */
export * as tsMorph from 'ts-morph';
export * as semver from 'semver';
export * as zod from 'zod';
export { glob } from 'fast-glob';
export * as YAWN from 'yawn-yaml';
