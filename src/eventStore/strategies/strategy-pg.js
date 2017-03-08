import _isDate from 'lodash/isDate';
import _isNumber from 'lodash/isNumber';
import BaseStrategyPrototype from './baseStrategy';
import {ConfigurationError, SQLError} from '../../errors';

const PgPromise = require('pg-promise');
const PQ = PgPromise.ParameterizedQuery;



const Strategy = {
  init: function(config) {

  },

  saveEvents: function(events) {
    if (!events.length) return;

    // TODO: This should be in the repository
    // const firstVersionToSave = events[0].version;
    // const lastVersion = this.getLastCommittedVersion(aggregateId, {limit: 1, order: 'desc'});
    // if (lastVersion >= firstVersionToSave) {
    //   throw new Error(`Concurrency error for aggregate ${aggregateId}.  Attempting to save stream starting at version ${firstVersionToSave} when stream already at ${lastVersion}`);
    // }

    // Get the fields to save;
    const fields = Object.keys(events[0]);
    const sql = this.pgp.helpers.insert(events, fields,  this.eventTableName);

    return this.db.none(sql)
      .then(() => events)
      .catch(err => {
        throw new SQLError(sql, err);
      })

  },

  saveSnapshot: function(aggregateId, snapshot) {
    const fields = Object.keys(snapshot);
    const sql = this.pgp.helpers.insert(snapshot, null,  this.snapshotTableName);

    return this.db.none(sql)
      .catch(err => {
        err.sql = sql;
        throw err;
      })
  },

  getSnapshotBefore: function(aggregateId, marker) {
    marker = marker || new Date();

    let prop, sql;
    if (_isNumber(marker)) {
      sql = `SELECT * FROM ${this.snapshotTableName} WHERE aggregate_id=$1 AND version < $2 LIMIT 1`;
    } else if (_isDate(marker)) {
      sql = `SELECT * FROM ${this.snapshotTableName} WHERE aggregate_id=$1 AND created < $2 LIMIT 1`;
    } else {
      throw new Error(`getSnapshotBefore: unknown marker type: ${typeof marker}`);
    }

    const query = new PQ(sql, [aggregateId, marker]);

    return this.db.oneOrNone(query)
      .catch(err => {
        err.sql = query.toString();
        throw err;
      })
  },

  getEvents: function(aggregateId, options={}) {
    const start = options.start || 0;
    const end = options.end;

    const whereClause = ['aggregate_id=$[aggregateId]'];
    const values = {aggregateId};

    if (_isNumber(options.start))  {
      whereClause.push('version > $[start]');
      values.start = options.start;
    } else if (_isDate(options.start)) {
      whereClause.push('created > $[start]');
      values.start = options.start;
    }

    if (_isNumber(options.end))  {
      whereClause.push('version < $[end]');
      values.end = options.end;
    } else if (_isDate(options.end)) {
      whereClause.push('created < $[end]');
      values.end = options.end;
    }

    const orderClause = (options.order === 'desc')
      ? 'ORDER BY version DESC'
      : 'ORDER BY version ASC';


    const limitClause =(_isNumber(options.limit) && options.limit > 0)
      ? `LIMIT ${options.limit}`
      : '';

    const sql = `SELECT * FROM ${this.eventTableName} WHERE ${whereClause.join(' AND ')} ${orderClause} ${limitClause}`

    return this.db.any(sql, values)
      .catch(err => {
        throw new SQLError(sql, err);
      })
  },
}

const PgStrategy = Object.assign({}, BaseStrategyPrototype, Strategy);


export default function CreatePg(config) {
  const requiredFields = [ 'db' ];
  const missingFields = requiredFields.filter(fld => !config[fld]);
  if (missingFields.length) {
    throw new ConfigurationError(`PG EventStore Strategy: missing fields [${missingFields.join(',')}]`);
  }

  const strategy = Object.create(PgStrategy);
  strategy.eventTableName    = config.eventTableName || 'events';
  strategy.snapshotTableName = config.snapshotTableName || 'snapshots';
  strategy.dbConfig          = config.db;
  strategy.initConfig        = config.init || {};

  const pgp = PgPromise(strategy.initConfig);
  const db = pgp(strategy.dbConfig);
  strategy.pgp = pgp;
  strategy.db = db;

  return strategy;
}
