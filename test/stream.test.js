import assert from 'assert';
import CreateStream from '../src/stream';

describe("Stream", () => {
  const aggregateId = 'abc';
  const aggregateType = 'testType';

  describe("Creating a stream", () => {
    it("rejects creation without aggregate type & id", () => {
      const willthrowId = () => CreateStream({aggregateType});
      const willthrowType = () => CreateStream({aggregateId});
      assert.throws(willthrowId);
      assert.throws(willthrowType);
    })
    it("creates a stream with only events passed", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
      ]
      const stream = CreateStream({aggregateId, aggregateType, events});
      assert.ok(stream);
      assert(stream.onVersion === 0);
      assert.equal(stream.events.length, 2);
    })

    it("creates a stream with events and a snapshot", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
      ]
      const snapshot = {state: {a: 'abc'}, version: 1};
      const stream = CreateStream({aggregateId, aggregateType, events, snapshot});

      assert.ok(stream);
      assert.ok(stream.getSnapshot());
    })

    it("trims event list based on snapshot version", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
        {name: 'evt1', version: 3},
        {name: 'evt1', version: 4},
        {name: 'evt1', version: 5},
      ]
      const snapshot = {state: {a: 'abc'}, version: 3};
      const stream = CreateStream({aggregateId, aggregateType, events, snapshot});

      assert.ok(stream);
      assert.ok(stream.getSnapshot());
      assert.equal(stream.getEvents().length, 2);
      assert.equal(stream.getEvents()[0].version, 4);

    })
  });


  describe("committed vs uncommitted behavior", () => {
    it("instantiates events as committed", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
      ]
      const stream = CreateStream({aggregateId, aggregateType, events});
      const uncommittedEvents = stream.getUncomittedEvents();
      assert.equal(uncommittedEvents.length, 0);
    });

    it("adds events as uncommitted", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
      ]
      const stream = CreateStream({aggregateId, aggregateType, events});
      stream.addEvent({name: 'evt2', version: 3});
      const uncommittedEvents = stream.getUncomittedEvents();
      assert.equal(uncommittedEvents.length, 1);

    })
  })

  describe("addEvent()", () => {
    it("Throws if added event version is out of sequence", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
      ]
      const event = {name: 'evt1', version: 5};
      const stream = CreateStream({aggregateId, aggregateType, events});
      const willThrow = () => stream.addEvent(event);
      assert.throws(willThrow);
    })

    it("Throws if added event version already exists", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
      ]
      const event = {name: 'evt1', version: 2};
      const stream = CreateStream({aggregateId, aggregateType, events});
      const willThrow = () => stream.addEvent(event);
      assert.throws(willThrow);

    })

    it("adds a sequential version number to unversioned event", () => {
      const events = [
        {name: 'evt1', version: 1},
        {name: 'evt1', version: 2},
      ]
      const event = {name: 'evt1'};
      const stream = CreateStream({aggregateId, aggregateType, events});
      assert.equal(stream.getEvents().length, 2);
      stream.addEvent(event);
      assert.equal(stream.getEvents().length, 3);
      assert.equal(stream.getEvents()[2].version, 3);

    })
  })
});
