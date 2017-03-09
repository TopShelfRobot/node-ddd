// domain.js
import path from 'path';
import tv4 from 'tv4';
import uuid from 'node-uuid';
import Promise from 'bluebird';
import _isObject from 'lodash/isObject';
import CreateAggregate, {isValidAggregate} from './aggregate';
import {isValidRepository} from './repository';
import {isValidService} from './service';
import CreateCommand from './command';
import CreateEvent from './event';
import CreateTransaction from './transaction';
import {ConfigurationError, ValidationError} from './errors';

import {CreateRegistry} from './messageHandler';





const defaultEventSchema = {
  type: 'object',
  properties: {
    name   : {type: 'string'},
    payload: {type: 'object'},
    meta   : {type: 'object'},
  },
  required: ['name', 'payload'],
}


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
    if (this.eventSchema) aggregate.extendEventSchema(this.eventSchema);

    const aggregateCommands = aggregate.getCommandHandlers().map(command => {
      command.aggregateType = aggregateType;
      return command;
    });

    this.aggregates[aggregateType] = aggregate;
    this.registerCommandHandlers(aggregateCommands);
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
  createCommand: function(name, commandVersion, props) {
    const command = this.commandRegistry.createMessage(name, commandVersion, props);

    // Extend the command.meta object with domain-specific informaiton
    const commandHandler = this.getCommandHandler(command);

    command.meta = Object.assign({},
      command.meta,
      {
        domain        : {name: this.name},
        commandHandler: commandHandler,
        aggregateType : commandHandler.aggregateType,
      }
    );

    return command;
  },


  /**
   * Execute a command
   * @param  {[type]} command [description]
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  execute: function(command, options) {
    options = options || {};

    return Promise.resolve()
      //
      // Create or get the transaction
      //
      .then(() => (options.transaction) ? options.transaction : this.createTransaction({autoCommit: true}) )
      //
      // Execute the command
      //
      .then(transaction => {
        const aggregateType = command.meta.aggregateType;
        const aggregateId = command.aggregateId;
        const aggregate = this.getAggregate(aggregateType);
        const domainMeta = {domain: command.meta.domain || {}};

        if (!this.repository) {
          throw new Error(`Missing a repository.  Use domain.useRepository() first`);
        }

        return Promise.resolve()
          // Get the aggregate stream from the repository
          .then(() => this.repository.get(aggregateId, aggregate) )
          // Lock the aggregate from editing by another user
          .tap(stream => transaction.lock(aggregateId))
          // Execute the command on the aggregate
          .then(stream => aggregate.execute(command, stream) )
          // Add the domain meta to each event in the stram (returns stream);
          .then(newStream => newStream.extendEvents(domainMeta))
          // add the stream to the transaction
          .then(newStream => transaction.addStream(newStream) )
          .catch(err => {
            transaction.cancel(err);
            throw err;
          });

      })
      //
      // Commit if autocommit is set
      //
      .then(transaction => {
        if (transaction.autoCommit && !transaction.isCommitted()) {
          return transaction.commit();
        } else {
          return transaction;
        }
      })

  },



  createTransaction: function(options) {
    return CreateTransaction(this, options);
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
  // ==== SERVICE
  // ===========================================================================
  addService(service) {
    if (!isValidService(service)) {
      throw new Error(`Please pass a valid service`);
    }
    this.services[service.name] = service;
    service.useDomain(this);
  },

  service(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Unknown service '${serviceName}' in domain ${this.name}`);
    }

    return service;
  },

  // ===========================================================================
  // ==== DEPENDENCY INJECTION
  // ===========================================================================
  useRepository: function(repository) {
    if (!isValidRepository(repository)) {
      throw new Error(`Please pass a valid repository`);
    }
    this.repository = repository;
    repository.useDomain(this);
  },

  normalizeEvent: function(evt) {
    if (this.repository && this.repository.eventStore) {
      return this.repository.eventStore.normalizeEvent(evt);
    }
  },

  usePublisher: function(publisher) {
    this.publisher = publisher
  },

  init() {
    return Promise.resolve(this);
  },

  newId() {
    return uuid.v4();
  }
}


const EventRegistry = CreateRegistry({
  messageType: 'event',
  versionProperty: 'eventVersion',
  schema: {
    type: 'object',
    properties: {
      name   : {type: 'string'},
      payload: {type: 'object'},
      meta   : {type: 'object'},
    },
    required: ['name', 'payload'],
  }
});
const CommandRegistry = CreateRegistry({
  messageType: 'command',
  versionProperty: 'commandVersion',
  schema: {
    type: 'object',
    properties: {
      name   : {type: 'string'},
      payload: {type: 'object'},
      meta   : {type: 'object'},
    },
    required: ['name', 'payload', 'meta'],
  }
});
const DomainPrototype = Object.assign({}, EventRegistry, CommandRegistry, Domain);



export default function CreateDomain(name, options={}) {
  if (_isObject(name)) {
    options = name;
  } else {
    options.name = name;
  }


  const domain = Object.create(DomainPrototype);

  domain.repository = null;
  domain.publisher = null;
  domain.aggregates = {};
  domain.repositories = {};
  domain.services = {};
  domain.events = {};
  domain.commands = {};
  domain.name = options.name || path.basename(__dirname);
  domain.commandSchema = options.commandSchema;
  domain.eventSchema = options.eventSchema;

  if (options.events) domain.loadEventHandlers(options.events);
  if (options.commands) domain.loadCommandHandlers(options.commands);
  if (options.commandSchema) domain.extendCommandSchema(options.commandSchema);


  return domain;
}


export function isValidDomain(domain) {
  return _isObject(domain);
}
