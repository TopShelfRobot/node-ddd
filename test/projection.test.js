import assert from 'assert';
import {CreateProjection} from '../src';

const getState = () => {};

describe.only("Projection", () => {
  describe("creating a projection", () => {
    const events = [
      {name: 'event-tested', eventVersion: 1, callback: () => {}, onComplete: () => {}}
    ];
    const getProjection = () => {};
    const putProjection = () => {};
    const normalSchema = {};

    it("creates a projection with all options", () => {
      const projection = CreateProjection('tester', {events, getProjection, putProjection, normalSchema})

      assert.ok(projection);
      assert.ok(projection.projector);
    });

    it("create a projection without a normalizing schema", () => {
      const projection = CreateProjection('tester', {events, getProjection, putProjection})

      assert.ok(projection);
    });

    it("requires an events object on creation", () => {
      const willThrow = () => CreateProjection('tester', {getState})
      assert.throws(willThrow, /Missing/);
    })

  });


  describe("getProjection()", () => {
    let store = null;
    const getProjection = () => {return store};
    const putProjection = state => { store = state; };
    const initialState = {count: 0, list: []};
    const events = [
      {name: 'increment', eventVersion: 1, callback: (payload, state) => Object.assign({}, state, {count: state.count +1})},
    ];
    const normalSchema = {
      type: 'object',
      properties: {
        norm_count: {type: 'number', path: 'count'},
        norm_list: {type: 'array', path: 'list'},
      }
    }

    it("returns the current state unaltered when there is no normalizing schema", done => {
      const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events});
      store = {norm_count:123, norm_list: [1,2,3]};

      projection.getProjection({})
        .then(state => {
          assert.deepEqual(state, store);
          done();
        }).catch(done);
    })

    it("returns the current state denormalized when there is a normalizing schema", done => {
      const projection = CreateProjection('tester', {getProjection, putProjection, initialState, normalSchema, events});
      store = {norm_count:123, norm_list: [1,2,3]};
      expected = {norm: store.norm_count, list: store.norm_list};

      projection.getProjection({})
        .then(state => {
          assert.deepEqual(state, expected);
          done();
        }).catch(done);
    })

    it("returns passed initial state if state is null", done => {
      const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events, normalSchema});
      store = null;

      assert.deepEqual(projection.initialState, initialState);

      projection.getProjection({})
        .then(state => {
          assert.deepEqual(state, initialState);
          done();
        }).catch(done);
    })

  })

})
