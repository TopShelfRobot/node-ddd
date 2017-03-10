import assert from 'assert';
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
      const evt = agg.createEvent('test1', 1, {
        payload: {a:1},
        meta: {b:2},
      });
      expect(evt).to.be.ok;
      expect(evt.name).to.equal('test1');
      expect(evt.eventVersion).to.equal(1);
      expect(evt.created).to.be.ok;
      expect(evt.payload).to.deep.equal({a:1});
      expect(evt.meta.b).to.equal(2);
    })

    it("creates an event with no props", () => {
      const evt = agg.createEvent('test1');
      assert.equal(evt.name, 'test1');
      assert.equal(evt.eventVersion, 1);
      assert.deepEqual(evt.payload, {});
      assert.deepEqual(evt.meta, {});
    })

    it("adds the event schema to the validation step", () => {
      const events = [{
        name: 'extra-validation',
        eventVersion: 1,
        callback: () => {},
        schema: {
          properties: {
            payload: {
              properties: {
                secret: {type: 'string'}
              },
              required: ['secret']
            }
          }
        }
      }];
      const payload = {secret: 'prop'};
      const agg = CreateAggregate('testAgg', {events});

      const evt = agg.createEvent('extra-validation', {payload});
      const willThrow = () => agg.createEvent('extra-validation');

      assert.equal(evt.name, 'extra-validation');
      assert.equal(evt.eventVersion, 1);
      assert.deepEqual(evt.payload, payload);
      assert.deepEqual(evt.meta, {});
      assert.throws(willThrow);

    })

  })


})
