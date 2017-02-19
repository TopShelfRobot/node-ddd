
export {default as series} from 'lodash/flow';
export {default as curry} from 'lodash/curry';

export function methodCurry(fn, length, self) {
  if (typeof length !== 'number') {
    self = length;
  }
  length = length || fn.length;
  self = self || this;

}
