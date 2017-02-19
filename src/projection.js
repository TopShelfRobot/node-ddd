import util from 'util'
import Promise from 'bluebird';
import {EventEmitter} from 'events';
import _cloneDeep from 'lodash/cloneDeep';
import canRunEvents from './canRunEvents';
import canHook from './canHook';


const Projection = {
  /**
   * Initializes the projection by running any initialization functions
   * defined.  Emits "ready" event when complete
   */
  init: function() {
    return Promise.resolve()
      .then(() => this.runHooks("Init"))
      .then(() => this.emit('ready'));
  },

  /**
   * Sets the function which is used to persist the current state
   * of the projection after each handleEvent
   *
   * @param  {Function} fn  Callback which returns the current state of the projection
   *                        The callback should be able to handle both insert
   *                        and update operations and determine when to use which.
   *                        Callback should be of the form:
   *                        	callback(<State>) : Promise<State>
   * @return {Object}      `this`
   */
  setSaveOrUpdate: function(fn) {
    if (typeof fn !== 'function') {
      throw new Error(`'save' must be a function`);
    }
    this._saveOrUpdate = fn;
    return this;
  },

  saveOrUpdate: function(state) {
    if (this._inReplay) {
      return Promise.resolve(this.cacheState(state));
    }

    return Promise.resolve(this._saveOrUpdate(state));
  },

  /**
   * Sets the function which is used to determine the current state
   * of the projection on each handleEvent
   *
   * @param  {Function} fn Callback which returns or resolves to the current
   *                       state of the projection.  Callback should be of the
   *                       form:
   *                       	callback(<Event>) : Promise<State>
   * @return {Object}      `this`
   */
  setLoad: function(fn) {
    if (typeof fn !== 'function') {
      throw new Error(`'load' must be a function`);
    }
    this._load = fn;
    return this;
  },

  load: function(evt) {
    if (this._inReplay && this.cacheState()) {
      return Promise.resolve(this.cacheState());
    }

    return Promise.resolve(this._load(evt));
  },


  handleEvent: function(evt) {
    return Promise.resolve()
      .then(() => this.emit('start_event', evt))
      .then(() => this.runHooks('beforeEvent', evt))
      .then(() => this._load(evt))
      .then(state => this.triggerEvent(evt, state))
      .then(newState => this.runHooks('afterEvent', evt, newState).return(newState))
      .then(newState => this._save(evt, state).return(newState))
      .then(newState => this.emit('end_event', {event: evt, state: newState}))
      .catch(err => {
        this.emit('error', {error: err, event: evt});
      });
  },



  beforeEvent: function(fn) { return this.beforeHook('Event', fn) },
  afterEvent: function(fn) { return this.afterHook('Event', fn) },
  onInit: function(fn) { return this.addHook('Init', fn) },

  cacheState: function(state) {
    if (state) {
      this._cacheState = _cloneDeep(state);
    }
    return this._cacheState;
  }
}

const ProjectionProto = Object.assign({},
  Projection,
  canRunEvents,
  canHook,
  EventEmitter.prototype
);

export default function CreateProjection(name, options={}) {
  if (typeof name !== 'string') {
    throw new Error(`'name' is required to create a projection`);
  }

  const projection = Object.create(ProjectionProto);

  projection.name          = name;
  projection._load         = throwNotImplemented(projection.name, 'load');
  projection._saveOrUpdate = throwNotImplemented(projection.name, 'saveOrUpdate');

  if (options.load) this.setLoad(options.load);
  if (options.saveOrUpdate) this.setSaveOrUpdate(options.saveOrUpdate);

  EventEmitter.call(projection);

  return projection
}


function throwNotImplemented(projectionName, missingMethod) {
  return function() {
    return Promise.reject(new Error(`Projection (${projectionName}) method '${missingMethod}' has not been implemented`));
  }
}
