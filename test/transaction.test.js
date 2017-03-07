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

  describe("summary()", () => {
    it("presents a summary of the transaction", () => {
      const t = CreateTransaction();
      const transactionId = t.transactionId;
      const expected = {
        transactionId: transactionId,
        status: 'active',
        streams: [],
        meta: {},
        failReason: null,
      }
      assert.deepEqual(t.summary(), expected);
    })
  })
})
