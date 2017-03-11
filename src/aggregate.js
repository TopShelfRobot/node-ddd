import moment from 'moment';
import Promise from 'bluebird';
import uuid from 'node-uuid';
import _isObject from 'lodash/isObject';
import _isString from 'lodash/isString';
import CreateProjector from './projector';
import {CreateRegistry} from './messageHandler';
import CreateEvent from './event';
import DomainUser from './components/domainUser';
import {isValidDomain} from './domain';
import {ValidationError} from './errors';


function extendEventMeta(evt, meta) {
  meta = meta || {};
  evt.meta = Object.assign((evt.meta || {}), meta);
  return evt;
}

const Aggregate = {
  getNewId: function() {
    return uuid.v4();
  },


  project(stream) {
    const {aggregateId, aggregateType} = stream;
    const finalState = this.projectStream(stream);

    return Object.assign(finalState, {aggregateId, aggregateType});
  },

  /**
   * Executes a command on an aggregate,
   * adds those events to the aggregate stream,
   * plays the stream forward
   *
   * @param  {Command} cmd               The command to execute
   * @param  {Stream} stream            Aggregate stream of events
   * @param  {Object} commandContext={} Optional contextual data for the command. Will be merged in to the meta information for any generated event
   * @return {Stream}                   The updated stream object
   */
  execute(cmd, stream) {

    const additionalMeta = {
      aggregateType: this.aggregateType,
      command: cmd.meta
    };

    return Promise.all([
      this.project(stream),
      this.getCommandHandler(cmd)
    ])
      // Execute the command after some sanity checks
      .then(([currentState, handler]) => {
        if (!handler) {
          throw new Error(`Could not find command handler for '${cmd.name}' v${cmd.commandVersion} on aggregate ${this.aggregateType}`);
        }
        if (currentState.aggregateType !== this.aggregateType) {
          throw new Error(`Aggregate is of wrong type for this command: state(${currentState.aggregateType}) aggregate(${this.aggregateType})`);
        }

        return handler.execute(cmd, currentState, this);
      })
      // Confirm that we have a valid array of events
      .then(events => (Array.isArray(events)) ? events : [events])
      // Place the command meta in each event meta
      .then(events => events.map(evt => extendEventMeta(evt, additionalMeta)) )
      // Add the events to the stream (returns a stream)
      .then(events => stream.addEvents(events) )
  },



  createEvent(name, eventVersion, props) {
    if (_isObject(eventVersion)) {
      props = eventVersion;
      eventVersion = null;
    }

    props = props || {};

    props = Object.assign({}, (props || {}), {
      payload: props.payload || {},
      meta: props.meta || {},
      created: moment().toISOString(),
      version: -1,
      aggregateType: this.aggregateType,
    });

    return this.eventRegistry.createMessage(name, eventVersion, props);
  },

}


/**
 * Aggregate Factory
 * @param {[type]} aggregateId [description]
 * @param {[type]} stream      [description]
 */
export default function CreateAggregate(aggregateType, options={}) {
  const Projector = CreateProjector();
  const CommandRegistry = CreateRegistry({messageType: 'command', versionProperty: 'commandVersion'});
  const AggregatePrototype = Object.assign({}, DomainUser(`Aggregate ${aggregateType}`), CommandRegistry, Projector, Aggregate);
  const aggregate = Object.create(AggregatePrototype);

  aggregate.domain        = null;
  aggregate.aggregateType = aggregateType;

  // createEvent will be injected in to command handlers.  So should be
  // bound to the aggregate now.
  aggregate.createEvent = aggregate.createEvent.bind(aggregate);

  if (options.domain) aggregate.useDomain(options.domain);
  if (options.commands) aggregate.loadCommandHandlers(options.commands);
  if (options.events) aggregate.loadEventHandlers(options.events);

  return aggregate;
}

export function isValidAggregate(aggregate) {
  return _isObject(aggregate) && _isString(aggregate.aggregateType);
};
