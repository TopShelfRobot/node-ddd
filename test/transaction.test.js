import assert from 'assert';
import CreateTransaction from '../src/transaction';

describe("Transaction", () => {
  describe("committing", () => {
    it("can commit an empty transaction", done => {
      const t = CreateTransaction();
      t.commit().then(t => {
        assert.ok(t.startTime);
        assert.ok(t.endTime);
        assert.ok(t.elapsed+1);
        done()
      }).catch(done);
    })

  })
})
