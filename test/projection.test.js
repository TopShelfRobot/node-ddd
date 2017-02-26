import assert from 'assert';
import {CreateProjection} from '../src';

const getState = () => {};

describe.only("Projection", () => {
  describe("creating a projection", () => {
    it("creates a projection", () => {
      const events = [
        {name: 'event-tested', eventVersion: 1, callback: () => {}, onComplete: () => {}}
      ];
      const projection = CreateProjection('tester', {events, getState})

      assert.ok(projection);
      assert.ok(projection.projector);
    });

    it("requires an events object on creation", () => {
      const willThrow = () => CreateProjection('tester', {getState})
      assert.throws(willThrow, /Missing/);
    })

    it("requires each event handler to have an onComplete method", () => {
      const events = [
        {name: 'event-tested', eventVersion: 1, callback: () => {}}
      ];
      const willThrow = () => CreateProjection('tester', {events, getState})
      assert.throws(willThrow, /onComplete/);
    })
  });

})
