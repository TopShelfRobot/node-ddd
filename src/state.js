import curry from 'lodash/curry';
import compose from 'lodash/flow';
import _cloneDeep from 'lodash/cloneDeep';

function _getMeta(prop, state) {
  return state._meta[prop];
}
function _updateMeta(prop, value, state) {
  const _meta = Object.assign({}, (state._meta || {}), {[prop]: value});
  return Object.assign({}, state, {_meta});
}
function _appendMeta(prop, item, state) {
  const newVal = (_getMeta(prop, state) || []).concat(item);
  return _updateMeta(prop, newVal, state);
}
const getMeta    = curry(_getMeta);
const updateMeta = curry(_updateMeta);
const appendMeta = curry(_appendMeta);
export const getType       = getMeta('aggregateType');
export const getId         = getMeta('aggregateId');
export const getVersion    = getMeta('version');
export const getEvents     = getMeta('transientEvents');
export const updateVersion = updateMeta('version');
export const appendEvents  = appendMeta('transientEvents');
export const clearEvents   = updateMeta('transientEvents', []);

/**
 * Determines if the passed obj is a state object by duck-typing
 *
 * @param  {Any}  obj Item to test
 * @return {Boolean}       True if it is a valid state, false otherwise
 */
export function isState(obj) {
  return !!obj._meta && getType(obj) && getId(obj);
}

export function createState(aggregateType, aggregateId, initialState={}, version=0) {
  if (!aggregateType) throw new Error('Missing `aggregateType`');
  if (!aggregateId) throw new Error('Missing `aggregateId`');

  const _meta = {
    aggregateType: aggregateType,
    aggregateId: aggregateId,
    version: version,
    transientEvents: [],
  };

  return Object.assign({}, initialState, {_meta});
}


export const incrementVersion = state => updateVersion(getVersion(state) + 1, state);
export const addTransientEvent = curry(appendEvents);


/**
 * Applies an event to a state, given an aggregate
 *
 * Curried, so that this function may be composed with other state-
 * augmenting functions
 *
 * @param  {Aggregate} aggregate The aggregate of the same type as state
 * @param  {Event} event     The event to be applied to the aggregate state
 * @param  {State} state     The state to be mutated
 * @return {State}           The state after the event has been applied
 */
const _applyEvent = (aggregate, event, state) => aggregate.triggerEvent(event, state);
export const applyEvent = curry(_applyEvent);

/**
 * Return the unpersisited events for this aggregate state
 *
 * The returned events will be given version numbers based on their
 * position in the array and the version of the aggregate, and will
 * optionally contain context data (userId, transactionId, etc) passed
 * to the function
 *
 * @param  {State} state      A valid state object
 * @param  {Object} context={} Optional hash of contextual data to be merged with each event
 * @return {Array<Event>}            Resultant array of transient events stored on the state
 */
export function getTransientEvents(state, context={}) {
  const events = getEvents(state);
  const version = getVersion(state);

  if (!Array.isArray(events)) {
    throw new Error("Invalid state: missing _transientEvents property");
  }

  return events.map((evt, idx) => {
    return Object.assign({}, evt, context, {
      version: version + idx + 1,
    });
  })
}


/**
 * Applies a series of events to a state
 * Increments the state version for every event.
 *
 * This is used to replay events in order to rehydrate an aggregate root
 *
 * @param  {Array<Events>} events The events to be replayed
 * @param  {State} state  The Aggregate state to which the events should be applied
 * @return {State}        A new state resulting from the applied events
 */
export function replayEvents(aggregate, events, state) {
  const clonedState = _cloneDeep(state);
  const _applyEvent = (state, evt) => compose(
    applyEvent(aggregate, evt),
    incrementVersion
  )(state);
  return events.reduce(_applyEvent, clonedState);
}


/**
 * Applies a series of events to a state
 * Does NOT increment the state version.
 * Adds the event to the Aggregate state list of transient events
 *
 * This is used to apply new events (the results of commands)
 *
 * @param  {Array<Events>} events The events to be replayed
 * @param  {State} state  The Aggregate state to which the events should be applied
 * @return {State}        A new state resulting from the applied events
 */
export function addEventsToState(aggregate, events, state) {
  const clonedState = _cloneDeep(state);
  const _applyEvent = (state, evt) => compose(
    applyEvent(aggregate, evt),
    addTransientEvent(evt),
  )(state);

  return events.reduce(_applyEvent, clonedState);
};
export function addEventToState(aggregate, event, state) { return addEvents(aggregate, [event], state); }
