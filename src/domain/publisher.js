const Promise = require('bluebird');
const _clone = require('lodash/clone');

const Publisher = {
  on(type, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('"listener" argument must be a function');
    }

    const promised = evt => Promise.try(() => listener(evt));

    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(promised);
  },

  emit(type, ...args) {
    const listeners = this.listeners[type] || [];
    const promises = listeners.map(listener => listener.apply(this, args));
    return settleAll(promises);
  },

  onPublish(listener) { return this.on('publish', listener); },
  onInit(listener) { return this.on('init', listener); },


  publish(...args) { return this.emit.apply(this, ['publish', ...args]); },
  init(...args) { return this.emit.apply(this, ['init', ...args])},

  getListeners(type) {
    return _clone(this.listeners[type] || []);
  },
}



function settleAll(promises) {

  return Promise.all(promises.map(promise => promise.reflect()))
    .then(inspections => {
      const errors = inspections
        .filter(insp => !insp.isFulfilled())
        .map(insp => insp.reason());

      if (errors.length === 1) {
        throw errors[0];
      }

      if (errors.length) {
        throw {
          message: errors
            .map((err, idx) => `${idx+1} [${err.message}]`)
            .join('\n'),
          errors: errors
        }
      }
    })
}



export default function CreatePublisher(options) {
  options = options || {};

  const publisher = Object.create(Publisher);
  publisher.listeners = [];
  publisher.initiators = [];

  return publisher
}
