import {expect} from 'chai';
import CreateProjector from '../src/projector';

const mockStream = function(events, snapshot) {
  return {
    events, snapshot,
    getEvents: function() { return events; },
    getCurrentState: function() { return snapshot || {}; },
  }
}

describe("Projector", () => {


  describe("handler integration", () => {
    it("passes event registration through to event handler", () => {
      const proj = CreateProjector();
      const evt = {
        name: 'evt1',
        eventVersion: 1,
        callback: function(state, payload, evt) {
          return state + 1;
        }
      };


      expect(proj.getEventHandlers()).to.have.length(0)
      proj.registerEvent(evt);
      expect(proj.getEventHandlers()).to.have.length(1)
    })
  });

  describe("project()", () => {
    it("returns an updated state object from a single event", () => {
      const proj = CreateProjector();
      const evt = { name: 'evt1', eventVersion: 1, callback: (payload, state) => state + 1, };
      const stream = mockStream([ {name: 'evt1', eventVersion: 1} ], 1)

      proj.registerEvent(evt);
      const newState = proj.project(stream);
      expect(newState).to.equal(2);
    });

    it("returns an updated state object from an array of events", () => {
      const proj = CreateProjector();
      const evt = {
        name: 'increment',
        eventVersion: 1,
        callback: function(payload, state) {
          state.count += payload.amount;
          return state
        }
      }
      const stream = mockStream([
        {name: 'increment', eventVersion: 1, payload: {amount: 1}},
        {name: 'increment', eventVersion: 1, payload: {amount: 2}},
        {name: 'increment', eventVersion: 1, payload: {amount: 4}},
      ], {count: 0} )
      proj.registerEvent(evt);

      const newState = proj.project(stream);
      expect(newState.count).to.equal(7);
    })
    it("returns an updated state object from an array of events of differing eventVersion", () => {
      const proj = CreateProjector();
      const eventHandlers = [
        {
          name: 'increment',
          eventVersion: 1,
          callback: function(payload, state) {
            state.a += payload.amount;
          }
        },
        {
          name: 'increment',
          eventVersion: 2,
          callback: function(payload, state) {
            state.b += payload.amount;
          }
        },
        {
          name: 'increment',
          eventVersion: 3,
          callback: function(payload, state) {
            state.c += payload.amount;
          }
        }
      ];
      const events = [
        {name: 'increment', eventVersion: 1, payload: {amount: 1}},
        {name: 'increment', eventVersion: 2, payload: {amount: 2}},
        {name: 'increment', eventVersion: 3, payload: {amount: 4}},
      ];
      const state = {a: 0, b: 0, c: 0};
      const stream = mockStream(events, state);

      proj.registerEvents(eventHandlers);

      // console.log("HANDLERS", proj.getEventHandlers())
      const newState = proj.project(stream);
      expect(state.a).to.equal(1);
      expect(state.b).to.equal(2);
      expect(state.c).to.equal(4);
    })
  })
})
