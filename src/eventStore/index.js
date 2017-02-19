// src/eventStore/index.js

import CreateEventStore from './eventStore';
import * as strategies from './strategies';


const EventStore = {
  CreateEventStore,
  strategies,
}
export default EventStore;
export {isValidEventStore} from './eventStore'


// const pgEventStore = CreateEventStore({
//   db: {db},
//   tableName: 'events',
//   schema: {
//     aggregate_id  : {type: 'string', eventPath: 'aggregateId'},
//     aggregate_type: {type: 'string', eventPath: 'aggregateType'},
//     event_type    : {type: 'string', eventPath: 'type'},
//     payload       : {type: 'json',   eventPath: 'payload'},
//     dateStamp     : {type: 'date',   eventPath: 'dateStamp', defaultToNow: true},
//     user          : {type: 'string', eventPath: 'meta.user'},
//     portfolio_id  : {type: 'string', eventPath: 'meta.portfolioId'}
//   }
// });
//
// const memoryEventStore = CreateEventStore({
//   schema: {
//     aggregate_id  : {type: 'string', eventPath: 'aggregateId'},
//     aggregate_type: {type: 'string', eventPath: 'aggregateType'},
//     event_type    : {type: 'string', eventPath: 'type'},
//     payload       : {type: 'json',   eventPath: 'payload'},
//     dateStamp     : {type: 'date',   eventPath: 'dateStamp', defaultToNow: true},
//     user          : {type: 'string', eventPath: 'meta.user'},
//     portfolio_id  : {type: 'string', eventPath: 'meta.portfolioId'}
//   }
// });
