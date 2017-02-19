


const requiredMethods = [

  /**
   * @function saveEvents
   *
   * Append a list of events to the stream
   *
   * @param {String} aggregateId The aggregateId for the events to be saved
   * @param {Event[]} events The list of events to append
   */
  'saveEvents',
  /**
   * @function saveSnapshot
   *
   * Save a snapshot of an aggregate
   * If the strategy implements concurrency error checking, this is the place to
   * implement it.
   *
   * @param {Snapshot} The snapshot to save
   */
  'saveSnapshot',
  /**
   * @function getSnapshotBefore
   *
   * Retrieve a single snapshot before `start`
   *
   * @param {String} aggregateId  An aggregateId to search
   * @param {Number|Date} before=(new Date()) Version number or date
   *
   * @return {Snapshot} The found snapshot, null if none found
   */
  'getSnapshotBefore',
  /**
   * @function getEvents
   *
   * Get events for an aggregate
   *
   * If `options.start` is a version number, the search should be exclusive (>, not >=)
   * if `options.start` is a date, the search should be inclusive
   * `options.end` is inclusive for both version number and date
   * Null or undefined values for either `start` or `end` indicate there is no
   * limit placed on that parameter.
   *
   * The meaning of `start` and `end` does not change when `order` changes
   * (`start` is always lower/earlier).
   *
   * @param {String       aggregateId   An aggregateId to search
   * @param {Object}      options       A hash of search options
   * @param {Number|Date} options.start Beginning of the stream (version number or start date)
   * @param {Number|Date} options.end   End of the stream (version number or end date)
   * @param {('asc'|'desc')} options.order='asc' Order of returned events. Useful to find last n events
   * @param {Number}      options.limit the number of events to return
   *
   * @return {Event[]}  An array of Found events, empty array if none found
   */
  'getEvents',
];


export default function isValidStrategy(strategy) {
  const missing = requiredMethods.filter(opt => typeof strategy[opt] !== 'function');
  return !missing.length;
  // if (missing.length) {
  //   const err = new Error(`Missing required functions from eventStore definition: ${missing.join(', ')}`);
  //   throw err;
  // }
}
