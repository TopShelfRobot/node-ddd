import assert from 'assert';
import EventStore from '../../src/eventStore';


const mockStrategy = {
  init: () => 'init',
  saveEvents: () => 'saveEvents',
  saveSnapshot: () => 'saveSnapshot',
  getSnapshotBefore: () => 'getSnapshotBefore',
  getEvents: () => 'getEvents',
};

describe("EventStore", () => {
  describe("creating an eventStore", () => {

  });

  describe("normalizeEvent()", () => {
    it("normalizes an event based on a schema", () => {
      const evt = {
        aggregateId: 'abc',
        deeply: {nested: {property: 123}}
      };

      const eventSchema = {
        type: 'object',
        properties: {
          aggregateId: {type: 'string', path: 'aggregateId'},
          myProp     : {type: 'number', path: 'deeply.nested.property'},
        },
        required: ['aggregateId', 'myProp']
      }
      const eventStore = EventStore.CreateEventStore(mockStrategy, { eventSchema });
      const norm = eventStore.normalize('event', evt);

      assert.deepStrictEqual(norm, { aggregateId: 'abc', myProp: 123 });
    });

    it("treats ann array of paths as an OR-ed list", () => {
      const evt1 = { a: 1, b: 2, }
      const evt2 = { a: null, b: 2, }
      const evt3 = { a: 1, b: null, }
      const evt4 = { a: 1, b: 0, }

      const eventSchema = {
        type: 'object',
        properties: {
          res: {type: 'number', path: ['b','a']}
        }
      }
      const es = EventStore.CreateEventStore(mockStrategy, { eventSchema });

      assert.deepStrictEqual(es.normalize('event', evt1), {res: 2});
      assert.deepStrictEqual(es.normalize('event', evt2), {res: 2});
      assert.deepStrictEqual(es.normalize('event', evt3), {res: 1});
      assert.deepStrictEqual(es.normalize('event', evt4), {res: 0});

    })

  });


});
