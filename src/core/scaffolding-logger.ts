/* eslint no-console: 0 */

import { blue, cyan, magenta, dim, bold } from 'colorette';

import type { IEventHandler } from './scaffolding.interfaces';

export const scaffoldingLogger: IEventHandler = (event, source, data) => {
  switch (event) {
    case 'configure':
      //console.log(blue(event), cyan(source.id), `${('description' in source && source?.description) || ''}`);
      break;
    case 'register':
      console.log(blue(event), cyan(source.id), `${('description' in source && source?.description) || ''}`);
      break;
    case 'status':
      switch (data) {
        case 'queued':
        case 'executed':
          console.log(blue(data), cyan(source.id));
          break;
        default:
          break;
      }
      break;
    case 'message':
      console.log(blue(event), cyan(source.id), `[${data.type}] ${data.message}`);
      if (data.error) {
        console.error(data.error);
      }
      break;
    default:
      console.log(blue(event), cyan(source.id), data ?? '');
      break;
  }
};
