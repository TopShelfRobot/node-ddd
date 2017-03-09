import {expect} from 'chai';
import exampleInit from '../example/domain';
import {EventStore} from '../src'


describe("Example App", () => {
  let eventStore, domain;
  before(done => {
    const InMemoryStrategy = EventStore.strategies.InMemory();
    eventStore = EventStore.CreateEventStore(InMemoryStrategy, {eventSchema: null});
    exampleInit(eventStore)
      .then(dm => {
        domain = dm;
        done();
      })
      .catch(err => done(err));
  })


  describe("Creating an invoice", () => {
    it("creates the invoice without error", done => {
      const aggregateId = 'abx';
      const payload = {
        lineItems: [
          {description: 'Something Special', total: 100},
          {description: 'Something Normal', total: 200},
        ]
      }
      const meta = {};
      const cmd = domain.createCommand('createInvoice', {aggregateId, payload, meta});
      domain.execute(cmd)
        .then(() => done())
        .catch(err => done(err))
    });

    it("generates events for the invoice creation", () => {
      const events = eventStore.strategy._events;
      expect(events).to.have.length(3);
    });

    it("formats the events properly", () => {
      const events = eventStore.strategy._events;
      const aggregateId = events[0].meta.aggregateId;
      expect(aggregateId).to.be.ok;

      // Check eventNames
      const names = events.map(evt => evt.name);
      expect(names).to.deep.equal(['invoiceCreated', 'invoiceItemCreated', 'invoiceItemCreated']);

      // Check eventVersions
      const eventVersions = events.map(evt => evt.eventVersion);
      expect(eventVersions).to.deep.equal([1,1,1]);

      // Check aggregate versions
      const versions = events.map(evt => evt.version);
      expect(versions).to.deep.equal([1,2,3]);

      // check meta
      events.forEach(evt => {
        expect(evt.meta.aggregateId).to.equal(aggregateId);
        expect(evt.meta.aggregateType).to.equal('invoice');
        expect(evt.meta.transaction).to.be.ok;
        expect(evt.meta.transaction.transactionId).to.be.ok;
        expect(evt.meta.domain).to.be.ok;
        expect(evt.meta.domain.name).to.equal(domain.name);
      });
    });
  })
});
