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
        aggregateId: 'aggregateId',
        myProp: 'deeply.nested.property',
      }
      const eventStore = EventStore.CreateEventStore(mockStrategy, { eventSchema });
      const norm = eventStore.normalizeEvent(evt);

      assert.deepStrictEqual(norm, { aggregateId: 'abc', myProp: 123 });
    });

  });


});
