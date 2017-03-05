import Promise from 'bluebird';
import {ConfigurationError} from './errors';
import CreateProjector from './projector';
import Normalizer from './components/normalizer';

const Projection = {

  projectEvent(event) { return this.projectEvents(event); },
  projectEvents(events) {
    events = (Array.isArray(events)) ? events : [events];

    if (!events.length) return Promise.resolve()

    // TODO: Allow for a stream/array of events that apply to different
    // projections
    const evt = events[0];

    return Promise.resolve()
      .then(() => this.getProjection(evt))
      .then(currentState => this.projector.projectEvents(events, currentState))
      .then(newState => this.putProjection(newState))
      // TODO: Catch errors
  },

  getProjection(selector) {
    return Promise.try(() => this._getProjection(selector))
      .then(state => this.denormalize(this.normalSchema, state))
      .then(state => state || this.initialState);
  },

  putProjection(state) {
    return Promise.try(() => this.normalize(this.normalSchema, state))
      .then(record => this._putProjection(record));
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

  // Ensure that each event handler has an onComplete method
  // const missingOnComplete = options.events
  //   .filter(evt => typeof evt.onComplete !== 'function')
  //   .map(config => projector.eventRegistry.extractName(config));
  // if (missingOnComplete.length) {
  //   throw new ConfigurationError(`These event handlers are missing an onComplete method: [${missingOnComplete.join(',')}]`)
  // }


  const projection = Object.create(ProjectionPrototype);
  projection.name           = name;
  projection._getProjection = options.getProjection;
  projection._putProjection = options.putProjection;
  projection.normalSchema   = options.normalSchema;
  projection.initialState   = options.initialState || {};
  projection.options        = options;
  projection.projector      = projector;
  projection.projector.loadEventHandlers(options.events);

  projection.eventList = projection.projector.getEventHandlers().map(handler => handler.getName());

  return projection
}
