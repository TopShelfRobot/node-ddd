import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import _isNumber from 'lodash/isNumber';
import CreateHandler from './baseHandler';


export const BaseDispatcherPrototype = {

  /**
   * handlerSpec:
   * {
   * 	name: String,
   * 	description: String,
   * 	version: Number,
   * 	callback: Function
   * }
   * @param  {[type]} handlerSpec    [description]
   * @param  {[type]} handlerFactory [description]
   * @return {[type]}                [description]
   */
  createHandler: function(handlerSpec, handlerFactory) {
    handlerSpec = this.normalizeHandlerSpec(handlerSpec);
    handlerFactory = handlerFactory || CreateHandler;

    const {name, version} = handlerSpec.name;

    if (this.hasHandler(name)) {
      return this.getHandler(name).addVersion(handlerSpec);
    } else {
      const handler = handlerFactory(handlerSpec);
      this[this.collectionProperty][name] = handler;
      return handler;
    }
  },

  getHandler: function(name) {
    return this[this.collectionProperty][name];
  },

  hasHandler: function(name) {
    return !!this.getHandler(name);
  },

  getHandlers: function(allVersions=false) {
    const handlers = this[this.collectionProperty];


    if (allVersion) {
      return Object.keys(handlers).reduce((list, name) => {
        const allVersions = Object.keys(handlers[name]).reduce((list, version) => list.concat(handlers[name][version]));
        return list.concat(allVersions);
      }, []);
    } else {
      return Object.keys(handlers).reduce((list, name) => {
        const version = this.findMaxVersion(handlers[name]);
        return list.concat(handlers[name][version]);
      }, []);
    }
  },

  /**
   * Executes a handler
   *
   * Throws a meaningful error if an unknown handler.
   * Guarantees that an array is returned.
   *
   * applyhandler will always make the selector the last argument passed to
   * the handler.  So, if applyHandler is called with the following arguments:
   * 	applyHandler(mySelector, 1, 2, 3)
   * Then the user-specified handler function should have the following signature:
   * 	myHandleFn(num1, num2, num3, selector);
   *
   * @param  {String} handlerName [description]
   * @return {[type]}             [description]
   */
  applyHandler: function(selector, ...args) {
    return Promise.try(() => {
        selector = this.normalizeSelector(selector);
        const handler = this.getHandler(selector.name);
        if (!handler) throw new Error(`Unknown handler: '${selector.name}'`);

        return handler;
      })
      .then(handler => {
        const base = this.base || this;
        const handlerArgs = args.concat(selector);
        return handler.handleWith(base, selector.version, handlerArgs);
      });
  },

  normalizeHandlerSpec: function(handlerSpec) {

    const requiredProps = [ this.nameProperty, this.handleProperty ];
    const missing = requiredProps.filter(prop => !handlerSpec.hasOwnProperty(prop));

    if (missing.length) {
      throw new Error(`Handler is missing required properties: ${missing.join(', ')}`);
    }

    return Object.assign({}, handlerSpec, {
      name: handlerSpec[this.nameProperty],
      version: handlerSpec[this.versionProperty] || 0,
      handle: handlerSpec[this.handleProperty],
    });
  },

  normalizeSelector: function(selector) {

    const requiredProps = [ this.nameProperty ];
    const missing = requiredProps.filter(prop => !selector.hasOwnProperty(prop));

    if (missing.length) {
      throw new Error(`Selector is missing required properties: ${missing.join(', ')}`);
    }

    return Object.assign({}, selector, {
      name: selector[this.nameProperty],
      version: selector[this.versionProperty],
    });

  },

  _initDispatcher: function(options={}) {

    this.collectionProperty       = options.collection || '_handlers';
    this.nameProperty             = options.name || 'name';
    this.versionProperty          = options.version || 'version';
    this.handleProperty           = options.handle || 'handle';
    this.payloadProperty          = options.payload || 'payload';
    this.base                     = options.base;
    this[this.collectionProperty] = {};
    this.handlerFactory           = options.handlerFactory || CreateHandler;

    return this;
  }

}

export default function CreateDispatcher(options={}) {
  const dispatcher = Object.create(BaseDispatcherPrototype);
  return dispatcher._initDispatcher(options);
}
