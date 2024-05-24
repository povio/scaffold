/* eslint no-console: 0 */

import { blue, cyan, dim, italic, magenta, red } from 'colorette';
import { padEnd, padStart } from 'lodash';

import { type IEventHandler, Status } from './scaffolding.interfaces';

export function scaffoldingLogger(options: { verbose: boolean; debug: boolean }): IEventHandler {
  const verbose = options.verbose || options.debug;
  const debug = options.debug;

  // just print warnings, errors and executions
  return (event, source, data) => {
    if (event === 'message' && ['error', 'warning'].includes(data.type)) {
      console.log(
        //
        cyan(padStart(source.id, 50)),
        data.type === 'error' ? red(padEnd(`message:${data.type}`, 13)) : blue(padEnd(data.type, 13)),
        data.message,
      );
      if (data.error) {
        console.error(data.error);
      }
      return;
    } else if (source.constructor.name === 'Task') {
      if (event === Status.queued || event === Status.delegated) {
        console.log(
          //
          cyan(padStart(source.id, 50)),
          blue(padEnd(event, 13)),
          magenta('request' in source ? source.request.match : ''),
          source.description,
        );
        if (!verbose) {
          // print all messages for the task
          let addBreak = false;
          for (const message of 'messages' in source ? source.messages.filter((x) => ['info'].includes(x.type)) : []) {
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
      if (event === Status.executed) {
        console.log(
          //
          cyan(padStart(source.id, 50)),
          blue(padEnd(event, 13)),
          // source.description,
        );
        if (!verbose && event === Status.executed) {
          // print all messages for the task
          let addBreak = false;
          for (const message of 'messages' in source ? source.messages.filter((x) => ['info'].includes(x.type)) : []) {
            console.log(
              //
              padStart('╰───', 50),
              message.type === 'error'
                ? red(padEnd(`type:${message.type}`, 13))
                : blue(padEnd(`type:${message.type}`, 13)),
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
    if (verbose) {
      switch (event) {
        case Status.registered:
          if (debug || !['Module', 'Executor', 'Handler', 'Request'].includes(source.constructor.name)) {
            console.log(
              dim(padStart(source.id, 50)),
              debug ? italic(blue(padEnd(event, 13))) : blue(padEnd(event, 13)),
              'request' in source ? magenta(source.request.match) : '',
              dim(source.description || '[no description]'),
            );
          }
          break;
        case Status.configured:
          if (!debug) {
            return;
          }
          console.log(
            //
            dim(padStart(source.id, 50)),
            italic(blue(padEnd(event, 13))),
            dim(JSON.stringify(data)),
          );
          break;
        case Status.queued:
        case Status.delegated:
        case Status.disabled:
        case Status.conforming:
        case Status.executed:
        case Status.errored:
        case Status.uninitialized:
          if (debug || !['Module', 'Request', 'Handler'].includes(source.constructor.name)) {
            console.log(
              //
              dim(padStart(source.id, 50)),
              italic(blue(padEnd(event, 13))),
              dim(JSON.stringify(data)),
            );
          }
          break;
        case 'message':
          if (!['error', 'warning'].includes(data.type)) {
            console.log(
              //
              dim(padStart(source.id, 50)),
              blue(padEnd(`message:${data.type}`, 13)),
              dim(data.message),
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
