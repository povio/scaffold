/* eslint no-console: 0 */

import { blue, cyan, magenta, dim, bold } from 'colorette';

import type { IEventHandler } from './scaffolding.interfaces';

export const scaffoldingLogger: IEventHandler = (source, event, data) => {
  switch (source.type) {
    case 'module-stub':
    case 'module': {
      switch (event) {
        case 'message': {
          console.log(`${blue(source.name)} [module:${event}] ${data.type}: ${data.message}`);
          break;
        }
        case 'init': {
          break;
        }
        default: {
          console.log(`${blue(source.name)} [module:${event}] ${data ?? ''}`);
          break;
        }
      }
      break;
    }
    case 'request': {
      switch (event) {
        case 'register':
        case 'init': {
          break;
        }
        default: {
          console.log(`${blue(source.module.name)} [request:${event}] ${source.match} ${data ?? ''}`);
          break;
        }
      }
      break;
    }
    case 'executor': {
      switch (event) {
        default: {
          console.log(`${blue(source.module.name)} [executor:${event}] ${magenta(source.match)}  ${data ?? ''}`);
          break;
        }
      }
      break;
    }
    case 'task': {
      switch (event) {
        default: {
          console.log(
            `${blue(source.request.module.name)} [task:${event}] ${magenta(source.executor.match)} ${data ?? ''}`,
          );
          break;
        }
      }
      break;
    }
    case 'handler': {
      switch (event) {
        case 'prepared': {
          console.log(`${cyan('handler')} [handler:${event}] ${data ?? ''}`);
          Object.values(source.modulesDict).forEach((module) => {
            const color = module.status === 'completed' ? dim : bold;
            console.log(`${blue(module.name)} ${color(`[status:${module.status}] ${module.description ?? ''}`)}`);
            Object.values(module.tasks).forEach((task) => {
              console.log(
                `${blue(module.name)} [task:${task.executor.match}] [status:${task.status}] ${task.request.description ?? ''}`,
              );
            });
          });
          break;
        }
        default: {
          console.log(`${cyan('handler')} [handler:${event}] ${data}`);
          break;
        }
      }
      break;
    }
    default: {
      console.error(source, event, data);
    }
  }
};
