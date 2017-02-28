import Promise from 'bluebird';
import {ConfigurationError} from './errors';
import CreateProjector from './projector';

const Projection = {



  /**
   * handleEvent
   *
   * Handles a single event off an event queue
   *
   * @param  {Event} evt The event to handle
   * @return {Object}     Resolves to the new state
   */
  projectEvent(evt) {
    const eventHandler = this.projector.getEventHandler(evt);
    if (!eventHandler) { return Promise.resolve(); }

    return this.getState(evt)
      .then(currentState => eventHandler.execute(evt.payload, currentState) || currentState)
      .tap(newState => eventHandler.onComplete(newState, evt))
      .tap(newState => this.onComplete(newState, evt));
  },

  getState(evt) {
    return Promise.resolve(this.options.getState(evt))
      .then(state => state || this.options.initialState);
  },

  onComplete(state, evt) { },
  getEvents() {
    return this.eventList;
  }

}

export default function CreateProjection(name, options) {
  options = options || {};

  if (typeof name !== 'string') {
    throw new ConfigurationError(`Projection 'name' must be a stirng`);
  }
  if (!options.events) {
    throw new ConfigurationError(`Missing 'events' property from Projection '${name}' creation`);
  }
  if (!options.initialState) {
    throw new ConfigurationError(`Missing 'initialState' property from Projection '${name}' creation`);
  }
  if (typeof options.getState !== 'function') {
    throw new ConfigurationError(`Missing 'getState' function or 'getState' is not a function from Projection '${name}' creation`);
  }

  // TODO: move 'required methods' in to the projector or event registry
  const projector = CreateProjector();

  // Ensure that each event handler has an onComplete method
  const missingOnComplete = options.events
    .filter(evt => typeof evt.onComplete !== 'function')
    .map(config => projector.eventRegistry.extractName(config));
  if (missingOnComplete.length) {
    throw new ConfigurationError(`These event handlers are missing an onComplete method: [${missingOnComplete.join(',')}]`)
  }


  const projection = Object.create(Projection);
  projection.name = name;
  projection.options = options;
  projection.projector = projector;
  projection.projector.loadEventHandlers(options.events);

  projection.eventList = projection.projector.getEventHandlers().map(handler => handler.getName());

  return projection
}
