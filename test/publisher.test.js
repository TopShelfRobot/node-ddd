import assert from 'assert';
import CreatePublisher from '../src/domain/publisher';

describe("Publisher", () => {
  it("Creates a publisher", () => {
    const pub = CreatePublisher();
    assert.ok(pub);
  })

  it("registers a function", () => {
    const pub = CreatePublisher();
    assert.equal(pub.getListeners('publish').length, 0);
    pub.onPublish(() => {});
    assert.equal(pub.getListeners('publish').length, 1);
  });

  it("wraps registered functions in a promise", () => {
    const pub = CreatePublisher();
    pub.onPublish(() => {});
    const listener = pub.getListeners('publish')[0];
    const promise = listener();
    assert.equal(typeof promise.then, "function");
  });

  it("returns a promise when publishing", () => {
    const pub = CreatePublisher();
    const promise = pub.publish({});
    assert.equal(typeof promise.then, "function");
  });

  it("call all registered functions", done => {
    const pub = CreatePublisher();
    const store = [];
    pub.onPublish(() => store.push('a'));
    pub.onPublish(() => store.push('b'));
    pub.onPublish(() => store.push('c'));
    pub.publish({})
      .then(res => {
        assert.deepEqual(store, ['a','b','c']);
        done();
      })
      .catch(done);
  })

  it("calls all registered function regarless of thrown errors", done => {
    const pub = CreatePublisher();
    const store = [];
    pub.onPublish(() => store.push('a'));
    pub.onPublish(() => {throw new Error()});
    pub.onPublish(() => store.push('c'));
    pub.publish({})
    .then(res => {
      done(new Error("Should have thrown an error"))
    })
    .catch(err => {
      assert.deepEqual(store, ['a','c']);
      done();
    });

  })

  it("throws multiple errors", done => {
    const pub = CreatePublisher();
    const store = [];
    pub.onPublish(() => store.push('a'));
    pub.onPublish(() => {throw new Error('abc')});
    pub.onPublish(() => {throw new Error('def')});
    pub.publish({})
    .then(res => {
      done(new Error("Should have thrown an error"))
    })
    .catch(err => {
      assert.equal(err.errors.length, 2);
      done();
    })
    .catch(done)

  })
})
