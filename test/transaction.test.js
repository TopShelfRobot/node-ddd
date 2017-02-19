import {expect} from 'chai';
import CreateTransaction from '../src/transaction';

describe("Transaction", () => {
  describe("addStream()", () => {
    it("adds the transaction data to the events in a stream", () => {
      let extension;
      const mockStream = {
        extendEvents: (d) => { extension=d },
      };
      const trans = CreateTransaction({}, mockStream);
      trans.addStream(mockStream);
      expect(extension).to.have.property('transaction');
      expect(extension.transaction.transactionId).to.equal(trans.transactionId);
    })
  })
})
