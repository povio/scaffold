/* eslint no-console: 0 */

import { blue, cyan, dim, red, magenta } from 'colorette';
import { padStart, padEnd } from 'lodash';

import { Task } from './scaffolding.classes';
import { type IEventHandler, Status } from './scaffolding.interfaces';

export function scaffoldingLogger(options: { verbose: boolean }): IEventHandler {
  // just print warnings, errors and executions
  return (event, source, data) => {
    if (event === Status.errored) {
      console.error(
        //
        cyan(padStart(source.id, 50)),
        blue(padEnd(event, 13)),
        data,
      );
      return;
    }
    if (event === 'message' && ['error', 'warning'].includes(data.type)) {
      console.log(
        //
        cyan(padStart(source.id, 50)),
        data.type === 'error' ? red(padEnd(data.type, 13)) : blue(padEnd(data.type, 13)),
        data.message,
      );
      if (data.error) {
        console.error(data.error);
      }
      return;
    } else if (source instanceof Task) {
      if (event === 'status' && ['queued', 'delegated'].includes(data)) {
        console.log(
          //
          cyan(padStart(source.id, 50)),
          blue(padEnd(data, 13)),
          magenta(source.request.match),
          source.description,
        );
        if (!options.verbose) {
          // print all messages for the task
          let addBreak = false;
          for (const message of source.messages.filter((x) => ['info'].includes(x.type))) {
            console.log(
              //
              padStart('╰───', 50),
              message.type === 'error' ? red(padEnd(message.type, 13)) : blue(padEnd(message.type, 13)),
              message.message,
            );
            addBreak = true;
          }
          if (addBreak) {
            console.log();
          }
        }
        return;
      }
      if (event === 'status' && ['executed', 'registered'].includes(data)) {
        console.log(
          //
          cyan(padStart(source.id, 50)),
          blue(padEnd(data, 13)),
          // source.description,
        );
        if (!options.verbose && data === 'executed') {
          // print all messages for the task
          let addBreak = false;
          for (const message of source.messages.filter((x) => ['info'].includes(x.type))) {
            console.log(
              //
              padStart('╰───', 50),
              message.type === 'error' ? red(padEnd(message.type, 13)) : blue(padEnd(message.type, 13)),
              message.message,
            );
            addBreak = true;
          }
          if (addBreak) {
            console.log();
          }
        }
        return;
      }
    }
    if (options.verbose) {
      switch (event) {
        case Status.registered:
          console.log(
            dim(padStart(source.id, 50)),
            blue(padEnd(event, 13)),
            'request' in source ? magenta(source.request.match) : '',
            dim(source.description || '[no description]'),
          );
          break;
        case 'message':
          if (!['error', 'warning'].includes(data.type)) {
            console.log(
              //
              dim(padStart(source.id, 50)),
              blue(padEnd(data.type, 13)),
              dim(data.message),
            );
          }
          break;
        case 'configured':
        case 'queued':
        case 'delegated':
        case 'disabled':
        case 'conforming':
        case 'executed':
        case 'uninitialized':
          console.log(
            //
            dim(padStart(source.id, 50)),
            blue(padEnd(event, 13)),
            dim(data),
          );
          break;
        case 'status':
          if (['queued'].includes(data)) {
            console.log(
              //
              dim(padStart(source.id, 50)),
              blue(padEnd(data, 13)),
            );
            return;
          } else {
            console.log(
              //
              dim(padStart(source.id, 50)),
              blue(padEnd(data, 13)),
            );
          }
          break;
        default:
          console.log(
            //
            dim(padStart(source.id, 50)),
            blue(padEnd(event, 13)),
            dim(JSON.stringify(data)),
          );
      }
    }
  };
}
