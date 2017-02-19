// domain.js
import path from 'path';
import tv4 from 'tv4';
import uuid from 'node-uuid';
import Promise from 'bluebird';
import _isObject from 'lodash/isObject';
import CreateAggregate, {isValidAggregate} from './aggregate';
import {isValidRepository} from './repository';
import CreateCommand from './command';
import CreateEvent from './event';
import CreateTransaction from './transaction';
import {ValidationError} from './errors';

import CreateRegistry from './handlerRegistry';

import eventSpecSchema from './domain/schemaEventSpec';



// TV4 validation error:
// {
//     "code": 0,
//     "message": "Invalid type: string",
//     "dataPath": "/intKey",
//     "schemaPath": "/properties/intKey/type"
// }
function formatTV4ValidationError(err) {
  return `${err.message} - Path: '${err.dataPath}'`;
}


function validateAgainstSchema(data, schema) {
  schema = schema || {};
  const result = tv4.validateMultiple(data, schema);

  if (!result.valid) {
    const missing = result.missing.map(m => `Missing ${m}`);
    const errors = result.errors.map(err => formatTV4ValidationError(err))
    return errors.concat(missing);
  } else {
    return [];
  }
}


const Domain = {

  createAggregate: function(aggregateType, options={}) {
    const aggregate = CreateAggregate(aggregateType, options);

    this.addAggregate(aggregate);
    return aggregate;
  },

  addAggregate(aggregate) {
    if (!isValidAggregate(aggregate)) {
      throw new Error(`Please pass a valid aggregate to domain ${this.name}`);
    }

    const {aggregateType} = aggregate;
    if (this.aggregates[aggregateType]) {
      throw new Error(`Aggregate '${aggregateType}' already exists in domain '${this.name}'`)
    }

    aggregate.useDomain(this);

    const aggregateCommands = aggregate.getCommandHandlers().map(command => {
      command.aggregateType = aggregateType;
      return command;
    });

    this.aggregates[aggregateType] = aggregate;
    this.registerCommands(aggregateCommands);
  },

  getAggregate: function(aggregateType) {
    const aggregate = this.aggregates[aggregateType];

    if (!aggregate) {
      throw new Error(`Unknown aggregate type: ${aggregateType}`);
    }

    return aggregate;
  },

  getRepository: function(aggregateType) {
    const repository = this.repositories[aggregateType];

    if (!repository) {
      throw new Error(`Unknown aggregate type: ${aggregateType}`);
    }

    return repository;
  },

  publish: function(evt) {
    if (this.publisher) {
      this.publisher.publish(evt);
    }
  },

  // ===========================================================================
  // ==== EVENTS
  // ===========================================================================




  

  /**
   * createEvent
   * Creates a domain event after validating the arguments
   * @param  {String} name    name of event
   * @param  {Object} payload Payload of the event
   * @param  {Object} meta    Metadata related to the event
   * @return {event}         The created event
   */
  createEvent: function(name, payload, meta) {
    // TODO: this is all fucked up
    throw new Error('not implemented');
  },


  validateEvent: function(event) {

  },
  // ---------------------------------------------------------------------------


  /**
   * createCommand
   * Creates a domain command after validation
   *
   * createCommand(cmdName, payload, meta)
   * createCommand(cmdName, version, payload, meta)
   *
   * @param  {String} name    The name of the command to create
   * @param  {Object} payload Payload for the command
   * @param  {Object} meta    Metadata about the command
   * @return {Command}        The Command
   */
  createCommand: function(name, commandVersion, payload, meta) {
    if (typeof commandVersion !== 'number') {
      meta = payload;
      payload = commandVersion;
      commandVersion = null;
    }

    meta = meta || {};
    payload = payload || {};

    const nameValidationErrors =this.validateCommandName(name);
    if (nameValidationErrors.length) {
      throw new ValidationError('Error creating command', nameValidationErrors);
    }

    // If missing a commandVersion, default to the current version
    // of the registered command handler
    commandVersion = commandVersion || this.getCommandVersion(name);

    const commandHandler = this.getCommandHandler({name, commandVersion});

    // Enhance the command meta object
    meta = Object.assign({}, meta, {
      domain        : this.name,
      commandHandler: commandHandler,
      aggregateType : commandHandler.aggregateType,
    });



    const validationErrors = [].concat(
      this.validateCommandPayload(payload, commandHandler.schema),
      this.validateCommandMeta(meta)
    );

    if (validationErrors.length) {
      throw new ValidationError('Validation Errors creating a command', validationErrors);
    }

    return CreateCommand(name, commandVersion, payload, meta);
  },

  validateCommand(command) {
    const {name, commandVersion, payload, meta} = command;
    if (!name || !meta || !meta.commandHandler) {
      return [`Invalid command sent to domain ${this.name}`];
    }

    const {commandHandler} = meta;

    return [].concat(
      this.validateCommandName(name),
      this.validateCommandPayload(payload, commandHandler.schema),
      this.validateCommandMeta(meta)
    );
  },

  validateCommandName(name) {
    if (!this.hasCommandHandler(name)) {
      return [`Unknown command sent to domain '${this.name}': '${name}'`];
    } else {
      return [];
    }
  },

  validateCommandPayload(payload, schema) {
    return validateAgainstSchema(payload, schema);
  },

  validateCommandMeta(meta) {
    return [];
  },


  execute: function(command, meta) {
    meta = meta || {};

    return Promise.resolve()
      //
      // validate the command
      //
      .then(() => {
        const validationErrors = this.validateCommand(command);
        if (validationErrors.length) {
          throw new ValidationError('Validation Errors executing a command', validationErrors);
        }
      })
      //
      // Create the transaction
      //
      .then(() => (meta.transaction) ? meta.transaction : this.CreateTransaction(meta) )
      //
      // Execute the command
      //
      .then(transaction => {
        const commandHandler = command.meta.commandHandler;

        if (commandHandler.aggregateType) {
          return this.executeDefaultCommand(command, transaction);
        } else {
          return this.executeCustomCommand(command, transaction);
        }
      })
      //
      // Commit
      //
      .then(transaction => {
        if (transaction.autoCommit && !transaction.isCommitted()) {
          return transaction.commit();
        } else {
          return transaction;
        }
      })





  },

  /**
   * executeDefaultCommand
   *
   * Exectues the default command handler, which loads an aggregate and
   * passes the command to be handled by that aggregate
   *
   * @param  {Command} command     The command to execute
   * @param  {Transaction} transaction Domain Transaction
   * @return {Transaction}             The resulting transaction
   */
  executeDefaultCommand: function(command, transaction) {
    const aggregateType = command.meta.aggregateType;
    const aggregateId = command.meta.aggregateId;
    const aggregate = this.getAggregate(aggregateType);

    // Basic workflow
    return Promise.resolve()
      .then(() => {
        if (!aggregate) {
          throw new Error(`Default Command Execution: Unknown aggregate type: ${aggregateType}`);
        }

        if (!this.repository) {
          throw new Error(`Missing a repository.  Use domain.useRepository() first`);
        }
      })
      .then(() => this.repository.get(aggregateId, aggregate) )
      .tap(stream => transaction.lock(aggregateId))
      .then(stream => aggregate.execute(command, stream) )
      .then(newStream => transaction.addStream(newStream) )
      .catch(err => {
        transaction.cancel(err);
        throw err;
      })
  },

  executeCustomCommand: function(command, transaction) {
    return Promise.resolve( command.meta.commandHandler )
      .then(commandHandler => {
        if (typeof commandHandler.callback !== 'function') {
          throw new Error(`Custom command '${command.name}' is missing a callback function`);
        }
        return commandHandler;
      })
      .then(commandHandler => commandHandler.callback(command, transaction))
      .catch(err => {
        transaction.cancel(err);
        throw err;
      })
  },

  CreateTransaction: function(meta) {
    return CreateTransaction(this, {meta});
  },
  // ---------------------------------------------------------------------------

  // ===========================================================================
  // ==== Aggregate lock
  // ===========================================================================
  lock: function(aggregateId, pid) {
    if (this.aggregateLock) {
      return aggregateLock.lock(aggregateId, pid);
    }
  },

  unlock: function(aggregateId, pid) {
    if (this.aggergateLock) {
      return aggregateLock.unlock(aggregateId, pid);
    }
  },
  // ---------------------------------------------------------------------------

  // ===========================================================================
  // ==== DEPENDENCY INVERSION
  // ===========================================================================
  useRepository: function(repository) {
    if (!isValidRepository(repository)) {
      throw new Error(`Please pass a valid repository`);
    }
    this.repository = repository;
    repository.useDomain(this);
  },

  usePublisher: function() {

  },
  // ---------------------------------------------------------------------------
  init() {
    return Promise.resolve(this);
  }
}


const EventRegistry = CreateRegistry({name: 'event', versionProperty: 'eventVersion'});
const CommandRegistry = CreateRegistry({name: 'command', versionProperty: 'commandVersion'});
const DomainPrototype = Object.assign({}, Domain, EventRegistry, CommandRegistry);



export default function CreateDomain(options={}) {
  const domain = Object.create(DomainPrototype);

  domain.repository = null;
  domain.publisher = null;
  domain.aggregates = {};
  domain.repositories = {};
  domain.events = {};
  domain.commands = {};
  domain.name = options.name || path.basename(__dirname);

  if (options.events) domain.registerEvents(options.events);
  if (options.commands) domain.registerCommands(options.commands);


  return domain;
}


export function isValidDomain(domain) {
  return _isObject(domain);
}
