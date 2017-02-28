import Promise from 'bluebird';
import dotty from 'dotty';
import createStream from '../stream';
import _isObject from 'lodash/isObject';
import _uniq from 'lodash/uniq';
const debug = require('debug')('eventStore');

import {isValidStrategy} from './strategies';


const EventStore = {
  /**
   * Preps an event to be persisted in the eventStore
   * @param  {Event} evt The event to be normalized
   * @return {Object}     The normalized event object
   */
  normalizeEvent(evt) {
    if (!this.eventSchema || !this.eventSchema.properties) return evt;


    const {properties, required=[]} =  this.eventSchema;
    const normEvt = Object.keys(properties).reduce((normalized, field) => {
      const eventPath = properties[field].path;

      if (!eventPath) {
        throw new ConfigurationError(`Event Schema for '${field}' is missing required 'path' property`, {event: evt});
      }

      let value;
      if (eventPath === '{date}') {
        value = new Date();
      } else {
        value = dotty.get(evt, eventPath);
      }

      if (required.indexOf(field) >= 0 && (value === undefined || value === null)) {
        const err = new Error(`Event is missing value for field ${field} at path ${eventPath}`);
        debug(err);
        throw(err);
      }

      dotty.put(normalized, field, value);
      return normalized;
    }, {});
    return normEvt;
  },

  /**
   * Converts an eventStore record to an event
   * @param  {Object} record Item returned from the eventStore
   * @return {Event}        Rehydrated event
   */
  denormalizeEvent(record) {
    if (!this.eventSchema) return record;

    return Object.keys(this.eventSchema).reduce((evt, field) => {
      const eventPath = this.eventSchema[field];
      const value = dotty.get(record, field);
      dotty.put(evt, eventPath, value);
      return evt;
    }, {});
  },

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
      .then(records => records.map(rec => this.denormalizeEvent(rec)) );
  },


  saveEvents: function(aggregateId, events) {
    if (!aggregateId) {
      throw new Error(`Cannot save events: Missing aggregateId`);
    }
    if (!events.length) return Promise.resolve();
    if (!Array.isArray(events)) events = [events];

    // Check that all events are for the same aggregateId
    // Get the aggregateId
    const wrongAggId = events.filter(evt => evt.meta.aggregateId !== aggregateId);
    if (wrongAggId.length) {
      throw new Error(`Multiple aggregateIds found in the event stream to be saved`);
    }

    events = events.map(evt => this.normalizeEvent(evt));

    return Promise.try(() => this.strategy.saveEvents(aggregateId, events));
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

const EventStorePrototype = Object.assign({}, EventStore);

/**
 * Create an EventStore
 * @param {[type]} options [description]
 */
export default function CreateEventStore(strategy, options={}) {
  isValidStrategy(strategy);

  const eventStore = Object.create(EventStorePrototype);

  eventStore.strategy        = strategy;
  eventStore.eventSchema     = options.eventSchema;
  eventStore._normalizeEvent = options.normalizeEvent;

  return eventStore;
}


export function isValidEventStore(es) {
  return _isObject(es) && !!es.strategy && isValidStrategy(es.strategy);
}
