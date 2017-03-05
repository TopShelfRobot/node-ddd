import CreateRegistry from './handlerRegistry';

const Projector = {
  project(...args) {
    return this.projectStream.apply(this, args);
  },

  projectStream(stream) {
    const initialState = stream.getCurrentState();
    const events = stream.getEvents();

    return this.projectEvents(events, initialState);
  },

  projectEvents(events, initialState) {
    return events.reduce(this.projectEvent.bind(this), initialState);
  },

  projectEvent(state, evt) {
    const eventHandler = this.getEventHandler(evt);

    if (!eventHandler) {
      throw new Error(`Could not find event handler for ${evt.name} version ${evt.eventVersion}`);
    }
    return eventHandler.execute(evt.payload, state) || state;
  }


}




/**
 * Creates a projector
 * @param {Object}  options={} Options used to create Projector
 * @param {Any}     options.initialState Initialize the projector's state to this value
 * @param {Object}  options.eventHandlers Keys of the object are the eventTypes,
 *                                        values are the functions which mutate
 *                                        projector's state, given an event
 */
export default function CreateProjector(options={}) {
  const EventRegistry = CreateRegistry({messageType: 'event', versionProperty: 'eventVersion'})
  const projector = Object.assign(EventRegistry, Projector );

  if (options.events) projector.loadEventHandlers(options.events);

  return projector;
}
