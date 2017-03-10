import Promise from 'bluebird';
import dotty from 'dotty';
import createStream from '../stream';
import _isObject from 'lodash/isObject';
import _isNil from 'lodash/isNil';
import _uniq from 'lodash/uniq';
import Normalizer from '../components/normalizer';
const debug = require('debug')('eventStore');

import {isValidStrategy} from './strategies';

function decorateErrorMessage(fn, msg) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch(err) {
      err.message = `${msg}: ${err.message}`;
      throw err;
    }
  }
}


const EventStore = {
  /**
   * Initializes the eventStore
   * Simple wrapper around implementation-specific init() to ensure
   * that it returns a Promise
   *
   * @return {Promise<any>} Return value of the init function
   */
  init() {
    return Promise.try(() => this._init());
  },



  /**
   * Get events from the eventStore
   *
   * Wraps the implementation-specific getEvents function to guarantee
   * that the function returns a Promise and events are denormalized.
   *
   * @param  {String} aggregateId The aggregateId to fetch
   * @param  {Number} postVersion Only fetch events after this version
   * @return {Array<Events>}      An Array of events
   */
  getEvents(aggregateId, postVersion=0) {
    return Promise.resolve()
      .then(() => this.strategy.getEvents(aggregateId, postVersion))
      .then(records => records.map(rec => this.denormalize('event', rec)) );
  },


  saveEvents: function(events) {
    if (!events.length) return Promise.resolve();
    if (!Array.isArray(events)) events = [events];

    const normalizedEvents = events.map(evt => this.normalize('event', evt));

    return Promise.try(() => this.strategy.saveEvents(normalizedEvents))
      .then(() => events);
  },

  getLastCommittedVersion: function(...args) {
    return Promise.try(() => this.strategy.getLastCommittedVersion.apply(this.strategy, args));
  },
  saveSnapshot: function(...args) {
    return Promise.try(() => this.strategy.saveSnapshot.apply(this.strategy, args));
  },
  getSnapshotBefore: function(...args) {
    return Promise.try(() => this.strategy.getSnapshotBefore.apply(this.strategy, args));
  },
  getLatestSnapshot: function() {
    return Promise.try(() => this.strategy.getSnapshotBefore(new Date()) );
  },
  init: function(...args) {
    return Promise.try(() => this.strategy.init.apply(this.strategy, args));
  },





}

const EventStorePrototype = Object.assign({}, Normalizer, EventStore);

/**
 * Create an EventStore
 * @param {[type]} options [description]
 */
export default function CreateEventStore(strategy, options={}) {
  isValidStrategy(strategy);

  const eventStore = Object.create(EventStorePrototype);

  eventStore.strategy = strategy;
  eventStore.normalize = decorateErrorMessage(eventStore.normalize, "Normalizing event for event store");
  eventStore.denormalize = decorateErrorMessage(eventStore.denormalize, "Denormalizing event for event store");
  if (options.eventSchema) {
    eventStore.addSchema('event', options.eventSchema);
  }

  return eventStore;
}


export function isValidEventStore(es) {
  return _isObject(es) && !!es.strategy && isValidStrategy(es.strategy);
}
