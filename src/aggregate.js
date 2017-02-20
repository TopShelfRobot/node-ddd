import Promise from 'bluebird';
import uuid from 'node-uuid';
import _isObject from 'lodash/isObject';
import _isString from 'lodash/isString';
import CreateProjector from './projector';
import CreateRegistry from './handlerRegistry';
import CreateEvent from './event';
import DomainUser from './components/domainUser';
import {isValidDomain} from './domain';
import {ValidationError} from './errors';

const Aggregate = {
  getNewId: function() {
    return uuid.v4();
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

    return Promise.all([
      this.project(stream),
      this.getCommandHandler(cmd)
    ])
      .then(([currentState, handler]) => {
        if (!handler) {
          throw new Error(`Could not find command handler for '${cmd.name}' v${cmd.commandVersion} on aggregate ${this.aggregateType}`);
        }

        if (typeof handler.callback !== 'function') {
          throw new Error(`Aggregate '${this.aggregateType}' command handler '${cmd.name}' is missing a callback function`);
        }

        const payload = cmd.payload;

        return handler.callback(payload, currentState, this.createEvent);
      })
      .then(events => {
        // TODO: confirm we received a valid event array
        if (!Array.isArray(events)) events = [events];
        return events;
      })
      .then(events => stream.addEvents(events) )

  },
  // ---------------------------------------------------------------------------



  createEvent(name, eventVersion, payload, meta={}) {
    if (typeof eventVersion !== 'number') {
      meta = payload;
      payload = eventVersion;
      eventVersion = null;
    }

    meta = meta || {};
    payload = payload || {};

    if (!this.hasEventHandler(name)) {
      throw new ValidationError(`Error creating event`, `Unknown event name '${name}' for aggregate '${this.aggregateType}'`);
    }

    // If missing a eventVersion, default to the current version
    // of the registered command handler
    eventVersion = eventVersion || this.getEventVersion(name);

    const eventHandler = this.getCommandHandler({name, eventVersion});

    meta = Object.assign({}, meta, {
      aggregateType: this.aggregateType,
      domain: (this.domain) ? this.domain.name : null,
    });

    // TODO: Add some event validation here

    return CreateEvent(name, eventVersion, payload, meta);
  },







}


/**
* Aggregate Factory
* @param {[type]} aggregateId [description]
* @param {[type]} stream      [description]
*/
export default function CreateAggregate(aggregateType, options={}) {
  const Projector = CreateProjector();
  const CommandRegistry = CreateRegistry({name: 'command', versionProperty: 'commandVersion'});
  const AggregatePrototype = Object.assign({}, DomainUser(`Aggregate ${aggregateType}`), CommandRegistry, Projector, Aggregate);
  const aggregate = Object.create(AggregatePrototype);

  aggregate.domain        = null;
  aggregate.aggregateType = aggregateType;

  // createEvent will be injected in to command handlers.  So should be
  // bound to the aggregate now.
  aggregate.createEvent = aggregate.createEvent.bind(aggregate);

  if (options.domain) aggregate.useDomain(options.domain);
  if (options.commands) aggregate.registerCommands(options.commands);
  if (options.events) aggregate.registerEvents(options.events);

  return aggregate;
}

export function isValidAggregate(aggregate) {
  return _isObject(aggregate) && _isString(aggregate.aggregateType);
};
