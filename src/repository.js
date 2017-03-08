import uuid from 'node-uuid';
import Promise from 'bluebird';
import _isObject from 'lodash/isObject';
import CreateStream from './stream';
import DomainUser from './components/domainUser';
import {isValidAggregate} from './aggregate';
import {isValidEventStore} from './eventStore';
import {isValidDomain} from './domain';


const Repository = {
  /**
   * get
   *
   * Gets a stream of events for the aggregateId of aggregateType
   *
   * @param  {UUID} aggregateId Unique Aggregate ID to fetch
   * @return {Stream}            Stream for the requested aggregate
   */
  get: function(aggregateId, aggregate) {
    aggregateId = aggregateId || uuid.v4();
    // Get the latest snapshot for this aggregate
    const snapshot = this.eventStore.getSnapshotBefore(aggregateId);

    // If there is a snapshot, only get the events after the snapshot,
    // otherwise get them all
    const events = snapshot.then(snapshot => {
      const postVersion = (snapshot) ? snapshot.version: 0;
      return this.eventStore.getEvents(aggregateId);
    });

    return Promise.all([snapshot, events]).then(([snapshot, events]) => {

      const stream = CreateStream({
        aggregateType: aggregate.aggregateType,
        aggregateId: aggregateId,
        events: events,
        snapshot: snapshot,
      });

      return stream;
    });
  },

  /**
   * save
   *
   * Save the uncommitted events from a stream to the event store
   *
   * @param  {stream} stream The event stream to save
   * @return {stream}        Fully committed stream
   */
  save: function(streams) {
    // TODO: Catch concurrency errors and handle them
    streams = (Array.isArray(streams)) ? streams : [streams];

    const events = streams.reduce(
      (events, stream) => events.concat(stream.getUncomittedEvents()),
      []
    );

    return this.eventStore.saveEvents(events)
      .map(evt => this.domain.publish(evt))
      .then(() => streams.forEach(stream => stream.commitAllEvents()) )
      .catch(err => {
        throw new Error(err.message);
      });
  },

  publish: function(event) {
    if (this.domain) {
      this.domain.publish(event);
    }
    return event;
  },


}



export default function CreateRepository(eventStore) {
  if (!isValidEventStore(eventStore)) {
    throw new Error(`Please pass a valid eventStore to create a repository`);
  }
  const RepositoryProto = Object.assign({}, DomainUser(`Repository`), Repository );
  const repo = Object.create(RepositoryProto);

  repo.eventStore    = eventStore;

  return repo;
}

export function isValidRepository(repo) {
  return _isObject(repo);
}
