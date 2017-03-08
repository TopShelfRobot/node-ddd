import _isDate from 'lodash/isDate';
import _isNumber from 'lodash/isNumber';
import BaseStrategyPrototype from './baseStrategy';

function eventAfterVersion(v) {
  return (evt) => evt.version > v;
}
function eventBeforeVersion(v) {
  return (evt) => evt.version <= v;
}
function eventAfterDate(d) {
  return (evt) => evt.created >= d;
}
function eventBeforeDate(d) {
  return (evt) => evt.created <= d;
}


const Strategy = {
  init: function(options) {

  },
  saveEvents: function(normEvents) {


    const firstVersionToSave = normEvents[0].version;
    // const lastVersion = this.getLastCommittedVersion(aggregateId, {limit: 1, order: 'desc'});
    // if (lastVersion >= firstVersionToSave) {
    //   throw new Error(`Concurrency error for aggregate ${aggregateId}.  Attempting to save stream starting at version ${firstVersionToSave} when stream already at ${lastVersion}`);
    // }

    normEvents.forEach(evt => this._events.push(evt) );
    return normEvents;
  },

  saveSnapshot: function(aggregateId, snapshot) {
    this._snapshots.push(snapshot);
  },

  getSnapshotBefore: function(aggregateId, marker) {
    marker = marker || new Date();

    let prop;
    if (_isNumber(marker)) {
      prop = 'version';
    } else if (_isDate(marker)) {
      prop = 'created';
    } else {
      throw new Error(`getSnapshotBefore: unknown marker type: ${typeof marker}`);
    }

    const snapshots = this._snapshots.reverse().filter(snp => {
      return snp.aggregateId === aggregateId && snp[prop] <= marker;
    });

    return (snapshots.length) ? snapshots[0] : null;

  },
  getEvents: function(aggregateId, options={}) {
    const start = options.start || 0;
    const end = options.end;

    let events = this._events.filter(evt => evt.aggregateId === aggregateId);

    if (_isNumber(options.start))  {
      events = events.filter(eventAfterVersion(options.start));
    } else if (_isDate(options.start)) {
      events = events.filter(eventAfterDate(options.start))
    }

    if (_isNumber(options.end))  {
      events = events.filter(eventBeforeVersion(options.end));
    } else if (_isDate(options.end)) {
      events = events.filter(eventBeforeDate(options.end))
    }

    if (options.order === 'desc') {
      events = events.reverse();
    }

    if (_isNumber(options.limit) && options.limit > 0) {
      events = events.slice(0, options.limit);
    }

    return events;
  },
}


const Methods = {
  dump: function() { return this._events; },
  dumpEvents: function() { return this._events; },
  dumpSnapshots: function() { return this._snapshots; },
  reset: function() { this._events = []; this._snapshots = []; },
}

const InMemoryPrototype = Object.assign({}, BaseStrategyPrototype, Strategy, {methods: Methods});


export default function CreateInMemory() {
  const strategy = Object.create(InMemoryPrototype);
  strategy._events = [];
  strategy._snapshots = [];

  return strategy;
}
