import assert from 'assert';
import {CreateProjection} from '../src';

const getState = () => {};

describe("Projection", () => {
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


  describe("get, put and project", () => {
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

    describe("getProjection()", () => {

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
        const expected = {count: store.norm_count, list: store.norm_list};

        projection.getProjection({})
        .then(state => {
          assert.deepEqual(state, expected);
          done();
        }).catch(done);
      })

      it("returns passed initial state if stored state is null", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events, normalSchema});
        store = null;

        assert.deepEqual(projection.initialState, initialState);

        projection.getProjection({})
        .then(state => {
          assert.deepEqual(state, initialState);
          done();
        }).catch(done);
      })

      it("uses an event custom getProjection if present", done => {
        const getProjection = () => 123;
        const customGetProjection = () => 456;
        const projection = CreateProjection('tester', {
          getProjection,
          putProjection,
          events: [
            {name: 'use-default', eventVersion: 1, callback: (payload, state) => Object.assign({}, state, {count: state.count +1})},
            {name: 'use-custom', eventVersion: 1, getProjection: customGetProjection, callback: (payload, state) => Object.assign({}, state, {count: state.count +1})},
          ],
        });

        Promise.all([
          projection.getProjection({name: 'use-default'}),
          projection.getProjection({name: 'use-custom'}),
        ])
          .then(([def, cust]) => {
            assert.equal(def, getProjection());
            assert.equal(cust, customGetProjection());
            done();
          })
          .catch(done);
      });

    })

    describe("putProjection()", () => {
      it("puts the state unaltered when there is no normalizing schema", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events});
        const state = {count: 123, list: [1,2,3]};
        store = null;

        projection.putProjection(state)
          .then(() => {
            assert.deepEqual(store, state);
            done();
          }).catch(done);
      });

      it("puts the normalized state  when there is a normalizing schema", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events, normalSchema});
        const state = {count: 123, list: [1,2,3]};
        const expected = {norm_count: state.count, norm_list: state.list};
        store = null;

        projection.putProjection(state)
          .then(() => {
            assert.deepEqual(store, expected);
            done();
          }).catch(done);
      });


    })

    describe("projectEvents()", () => {
      it("projects a single event without normalization", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events});
        const evt = {name: 'increment', eventVersion: 1, payload: {}, meta: {}};
        const expected = {count: 1, list: []};
        store = null;


        projection.projectEvent(evt)
          .then(() => {
            assert.deepEqual(store, expected);
            done();
          }).catch(done);
      })

      it("gracefully exits when unrecognized event is passed", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events});
        const evt = {name: 'idontexist', eventVersion: 1, payload: {}, meta: {}};
        const expected = {count: 1, list: []};
        store = null;


        projection.projectEvent(evt)
          .then(() => done())
          .catch(done);

      })

      it("projects multiple events without normalization", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, events});
        const evt = [
          {name: 'increment', eventVersion: 1, payload: {}, meta: {}},
          {name: 'increment', eventVersion: 1, payload: {}, meta: {}},
          {name: 'increment', eventVersion: 1, payload: {}, meta: {}},
        ]
        const expected = {count: 4, list: []};
        store = {count: 1, list:[]};


        projection.projectEvent(evt)
          .then(() => {
            assert.deepEqual(store, expected);
            done();
          }).catch(done);
      })

      it("projects a single event WITH normalization", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, normalSchema, events});
        const evt = {name: 'increment', eventVersion: 1, payload: {}, meta: {}};
        const expected = {norm_count: 1, norm_list: []};
        store = null;


        projection.projectEvent(evt)
          .then(() => {
            assert.deepEqual(store, expected);
            done();
          }).catch(done);
      })

      it("projects multiple events WITH normalization", done => {
        const projection = CreateProjection('tester', {getProjection, putProjection, initialState, normalSchema, events});
        const evt = [
          {name: 'increment', eventVersion: 1, payload: {}, meta: {}},
          {name: 'increment', eventVersion: 1, payload: {}, meta: {}},
          {name: 'increment', eventVersion: 1, payload: {}, meta: {}},
        ];
        const expected = {norm_count: 4, norm_list: []};
        store = {norm_count: 1, norm_list:[]};


        projection.projectEvent(evt)
          .then(() => {
            assert.deepEqual(store, expected);
            done();
          }).catch(done);
      })

    })

  })

})
