import {expect} from 'chai';
import CreateAggregate from '../src/aggregate';

describe("Aggregate", () => {
  describe("createEvent()", () => {
    let agg;
    before(done => {
      agg = CreateAggregate('testAgg', {
        events: [
          {name: 'test1', eventVersion: 1, callback: () => {}},
        ]
      });
      done();
    })

    it("Creates an event", () => {
      const evt = agg.createEvent('test1', 1, {a:1}, {b:2});
      expect(evt).to.be.ok;
      expect(evt.name).to.equal('test1');
      expect(evt.eventVersion).to.equal(1);
      expect(evt.createDate).to.be.ok;
      expect(evt.payload).to.deep.equal({a:1});
      expect(evt.meta.b).to.equal(2);
      expect(evt.meta.aggregateType).to.equal('testAgg');
    })

    it("Creates an event with only name and payload", () => {
      const evt = agg.createEvent('test1', {a:1});
      expect(evt).to.be.ok;
      expect(evt.name).to.equal('test1');
      expect(evt.eventVersion).to.equal(1);
      expect(evt.createDate).to.be.ok;
      expect(evt.payload).to.deep.equal({a:1});
      expect(evt.meta.aggregateType).to.equal('testAgg');
    })
  })
})
