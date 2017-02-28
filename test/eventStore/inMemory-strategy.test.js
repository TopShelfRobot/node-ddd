import assert from 'assert';
import _omit from 'lodash/omit';
import InMemory from '../../src/eventStore/strategies/strategy-inMemory';


describe('In-Memory eventStore strategy', () => {
  describe("creating the strategy", () => {
    it("returns an object", () => {
      const strat = InMemory();
      assert.ok(strat);
      assert(typeof strat === 'object');
    });
  });

  describe("init()", () => {
    it("initializes arrays", () => {
      const strat = InMemory();
      strat.init();
      assert(strat._events.length === 0);
      assert(strat._snapshots.length === 0);
    });
  });

  describe("getEvents", () => {
    const strat = InMemory();
    const aggregateId = 'abc';
    const aggregateId2 = 'def';

    before(() => {
      strat.init();
      strat._events = [
        {aggregateId: aggregateId2, created: new Date(2017, 1, 1), version: 1},
        {aggregateId: aggregateId2, created: new Date(2017, 1, 2), version: 2},
        {aggregateId: aggregateId2, created: new Date(2017, 1, 3), version: 3},
        {aggregateId: aggregateId, created: new Date(2017, 1, 1), version: 1},
        {aggregateId: aggregateId, created: new Date(2017, 1, 2), version: 2},
        {aggregateId: aggregateId, created: new Date(2017, 1, 3), version: 3},
        {aggregateId: aggregateId, created: new Date(2017, 1, 4), version: 4},
        {aggregateId: aggregateId, created: new Date(2017, 1, 5), version: 5},
        {aggregateId: aggregateId, created: new Date(2017, 1, 6), version: 6},
        {aggregateId: aggregateId, created: new Date(2017, 1, 7), version: 7},
        {aggregateId: aggregateId, created: new Date(2017, 1, 8), version: 8},
        {aggregateId: aggregateId, created: new Date(2017, 1, 9), version: 9},
        {aggregateId: aggregateId, created: new Date(2017, 1, 10), version: 10},
      ]
    });

    it("gets all events", () => {
      const events = strat.getEvents(aggregateId);
      assert(events.length === 10);
    });

    it("gets all events after version 5", () => {
      const start = 5;
      const events = strat.getEvents(aggregateId, {start});
      assert(events.length === 5);
      assert(events[0].version === 6);
    });

    it("gets all events after a date", () => {
      const start = new Date(2017,1,5);
      const events = strat.getEvents(aggregateId, {start});
      assert(events.length === 6);
      assert(events[0].version === 5);
    });

    it("gets events up to a version", () => {
      const end = 4;
      const events = strat.getEvents(aggregateId, {end});
      assert(events.length === 4);
      assert(events[3].version === 4);
    });
    it("gets events up to a date", () => {
      const end = new Date(2017,1,4);
      const events = strat.getEvents(aggregateId, {end});
      assert(events.length === 4);
      assert(events[3].version === 4);
    });
    it("limits the number of returned events", () => {
      const limit = 3;
      const events = strat.getEvents(aggregateId, {limit});
      assert(events.length === 3);
      assert(events[2].version === 3);
    })
    it("reverses the order of events", () => {
      const order = 'desc';
      const events = strat.getEvents(aggregateId, {order});
      assert(events.length === 10);
      assert(events[0].version === 10);
    })
    it("limits and reverses the order of events", () => {
      const order = 'desc';
      const limit = 1;
      const events = strat.getEvents(aggregateId, {order, limit});
      assert(events.length === 1);
      assert(events[0].version === 10);
    });
    it("limits, reverses and filters", () => {
      const order = 'desc';
      const limit = 3;
      const start = 2;
      const end = 7;
      const events = strat.getEvents(aggregateId, {start, end, order, limit});
      assert(events.length === 3);
      assert(events[0].version === 7);
      assert(events[2].version === 5);
    })
  });

  describe("saveEvents", () => {
    const strat = InMemory();
    const aggregateId = 'abc';

    before(() => {
      strat.init();
    });

    it("saves a stream of events to the store", () => {
      const events = [
        {aggregateId: aggregateId, created: new Date(2017, 1, 1), version: 1},
        {aggregateId: aggregateId, created: new Date(2017, 1, 2), version: 2},
      ]
      assert(strat.getEvents(aggregateId).length === 0)
      strat.saveEvents(aggregateId, events);
      assert(strat.getEvents(aggregateId).length === 2)
    })

    it("returns the array of events after saving", () => {
      assert(false);
    });
  })

})
