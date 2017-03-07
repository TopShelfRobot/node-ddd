import Promise from 'bluebird';
import {ConfigurationError} from './errors';
import CreateProjector from './projector';
import Normalizer from './components/normalizer';

const Projection = {

  projectEvent(event) { return this.projectEvents(event); },
  projectEvents(events) {
    events = (Array.isArray(events)) ? events : [events];

    if (!events.length) return Promise.resolve()

    // Note: This is highly inefficient when the array of events
    // all affect the same projection because each event will trigger
    // a fetch and a write (or multiple writes).
    // Refactor to make use of a cache so that there is only one write
    // stage per function call
    return Promise.each(events, evt => {

      return Promise.all([
        this.getProjection(evt),
        this.projector.getEventHandler(evt)
      ])
        .then(([currentState, eventHandler]) => {
          if (!eventHandler) {
            // Do something
          }
          return eventHandler.execute(evt.payload, currentState) || state
        })
        .then(newState => this.putProjection(newState))
        // TODO: Catch errors and handle, otherwise the entire loop stops

    })
  },


  getProjection(evt) {
    const getProjection = (this.customGetProjection[evt.name])
      ? this.customGetProjection[evt.name]
      : this.defaultGetProjection;

    return Promise.try(() => getProjection(evt))
      .then(state => this.denormalize(this.normalSchema, state))
      .then(state => state || this.initialState);
  },

  putProjection(states) {
    states = (Array.isArray(states)) ? states : [states];
    const putProjection = this.defaultPutProjection;

    return Promise
      .map(states, state => this.normalize(this.normalSchema, state))
      .map(record => putProjection(record))
  },

  useCustomGetProjection(eventName, getProjection) {
    if (typeof getProjection !== 'function') return;
    this.customGetProjection[eventName] = getProjection.bind(this);
  },

  useCustomPutProjection(eventName, putProjection) {
    if (typeof putProjection !== 'function') return;
    this.customPutProjection[eventName] = putProjection.bind(this);
  },


  getEvents() {
    return this.eventList;
  }

}

const ProjectionPrototype = Object.assign({}, Normalizer, Projection);

export default function CreateProjection(name, options) {
  options = options || {};

  if (typeof name !== 'string') {
    throw new ConfigurationError(`Projection 'name' must be a stirng`);
  }
  if (!options.events) {
    throw new ConfigurationError(`Missing 'events' property from Projection '${name}' creation`);
  }
  if (typeof options.getProjection !== 'function') {
    throw new ConfigurationError(`Missing 'getProjection' function or 'getProjection' is not a function from Projection '${name}' creation`);
  }
  if (typeof options.putProjection !== 'function') {
    throw new ConfigurationError(`Missing 'putProjection' function or 'putProjection' is not a function from Projection '${name}' creation`);
  }

  // TODO: move 'required methods' in to the projector or event registry
  const projector = CreateProjector();

  const projection = Object.create(ProjectionPrototype);
  projection.name                 = name;
  projection.defaultGetProjection = options.getProjection.bind(projection);
  projection.defaultPutProjection = options.putProjection.bind(projection);
  projection.customGetProjection  = {};
  projection.customPutProjection  = {};
  projection.normalSchema         = options.normalSchema;
  projection.initialState         = options.initialState || {};
  projection.options              = options;
  projection.projector            = projector;
  projection.projector.loadEventHandlers(options.events);

  // Register custom get- and putProjection functions
  (options.events || []).forEach(evt => {
    if (evt.getProjection) projection.useCustomGetProjection(evt.name, evt.getProjection);
    if (evt.putProjection) projection.useCustomPutProjection(evt.name, evt.putProjection);
  });

  projection.eventList = projection.projector.getEventHandlers().map(handler => handler.getName());

  return projection
}
