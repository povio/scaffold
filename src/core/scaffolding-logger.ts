/* eslint no-console: 0 */

import { blue, cyan, magenta, dim, bold } from 'colorette';

import type { IEventHandler } from './scaffolding.interfaces';

export const scaffoldingLogger: IEventHandler = (source, event, data) => {
  switch (source.type) {
    case 'module-stub':
    case 'module': {
      switch (event) {
        case 'configure': {
          console.log(`${blue(source.name)} [module:${event}] ${JSON.stringify(data)}`);
          break;
        }
        case 'message': {
          console.log(`${blue(source.name)} [module:${event}] ${data.type}: ${data.message}`);
          if (data.error) {
            console.error(data.error);
          }
          break;
        }
        case 'register':
        case 'status':
        case 'init': {
          break;
        }
        default: {
          console.log(`${blue(source.name)} [module:${event}]`);
          if (data) console.log(data);
          break;
        }
      }
      break;
    }
    case 'request': {
      switch (event) {
        case 'message': {
          console.log(`${blue(source.module.name)} [request:${event}] ${data.type}: ${data.message}`);
          if (data.error) {
            console.error(data.error);
          }
          break;
        }
        case 'register':
        case 'init': {
          break;
        }
        case 'init:error': {
          console.log(`${blue(source.module.name)} [request:${event}] [match:${source.match}]`);
          if (data) console.log(data);
          break;
        }
        default: {
          console.log(`${blue(source.module.name)} [request:${event}] [match:${source.match}]`);
          if (data) console.log(data);
          break;
        }
      }
      break;
    }
    case 'executor': {
      switch (event) {
        case 'register': {
          break;
        }
        default: {
          console.log(`${blue(source.module.name)} [executor:${event}] ${magenta(source.match)}`);
          if (data) console.log(data);
          break;
        }
      }
      break;
    }
    case 'task': {
      switch (event) {
        case 'init': {
          break;
        }
        case 'message': {
          console.log(
            `${blue(source.request.module.name)} [task:${event}] ${magenta(source.executor.match)} ${data.type}: ${data.message}`,
          );
          if (data.error) {
            console.error(data.error);
          }
          break;
        }
        default: {
          console.log(`${blue(source.request.module.name)} [task:${event}] ${magenta(source.executor.match)}`);
          if (data) console.log(data);
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
