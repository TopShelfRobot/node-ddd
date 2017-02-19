import Promise from 'bluebird';
import {Enum} from 'enumify';
import uuid from 'node-uuid';
import _omit from 'lodash/omit';


class TState extends Enum {
  isError() {
    switch (this) {
      case TState.failed:
      case TState.timeout:
        return true;
      default:
        return false;
    }
  }

  canCommit() {
    return this === TState.active
  }
}
TState.initEnum([
  'active',
  'committed',
  'failed',
]);



const Transaction = {
  addStream(stream) {
    const transactionData = Object.assign({}, this.meta, {
      transactionId: this.transactionId,
    });

    stream = stream.extendEvents({transaction: transactionData})
    this.uncommittedStreams.push(stream);
    return this;
  },

  lock(aggregateId) {
    this.domain.lock(aggregateId, this.transactionId)
    this.locks.push(aggregateId);
  },

  releaseLocks: function() {
    return Promise.resolve(this.locks)
      .map(aggregateId => this.domain.unlock(aggregateId, this.transactionId))
      .tap(() => this.locks = [])
      .return(this);
  },

  /**
   * commit
   *
   * Commits the transaction
   * 	Halts the timeout
   * 	Saves all uncommitted Streams
   * 	Releases all aggregate locks
   *
   * @return {transaction} This transaction
   */
  commit: function() {
    this.cancelTimeout();

    return Promise.resolve()
      .then(() => {

        if (!this.state.canCommit()) {
          if (this.state === TState.committed) {
            throw new Error(`Cannot commit transaction: already committed`);
          } else {
            throw new Error(`Cannot commit transaction: previously failed with error: ${this.failReason}`);
          }
        }

      })
      .then(() => this.uncommittedStreams)
      .map(stream => this.domain.repository.save(stream))
      .tap(committedStreams => {
        this.streams = this.streams.concat(committedStreams);
        this.uncommittedStreams = [];
      })
      .then(() => this.releaseLocks())
      .return(this);

  },


  /**
   * cancel
   *
   * Cancels the current transaction
   * 	Halts the timeout
   * 	Releases all aggregate locks
   * 	Clears any pending stream updates
   *
   * @return {Transaction}     This transaction
   */
  cancel: function(err) {
    this.cancelTimeout();

    return Promise.resolve()
      .tap(() => {
        this.uncommittedStreams = [];
        this.streams = [];
      })
      .then(() => this.releaseLocks())
      .return(this)
  },


  refreshTimeout: function() {
    this.cancelTimeout();
    this._timeout = setTimeout(() => this.onTimeout(), this.timeout);
  },

  cancelTimeout: function() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  },

  onTimeout: function() {
    // release all locks
    // log error
    // set transaction in timeout state
    this.setState(TState.failed, `Timeout with value of ${this.timeout}`);
  },

  setState(state, reason='') {
    if (!state instanceof TState) {
      throw new Error(`Please pass a valid transaction state.  Received ${state}`);
    }

    this.state = state;
    this.failReason = (state.isError()) ? reason : null;
    return this;
  },

  isCommitted() {
    return this.state === TState.committed;
  },



}


/**
 * CreateTransaction(domain, object);
 * CreateTransaction(domain, Transaction):
 */
export default function CreateTransaction(domain, options={}) {
  const transaction = Object.create(Transaction);

  const defaults = {
    transactionId     : uuid.v4(),
    state             : TState.active,
    failReason        : null,
    meta              : {},
    uncommittedStreams: [],
    streams           : [],
    locks             : [],
    autoCommit        : true,
    timeout           : 4000,
  }

  Object.assign(transaction, defaults, options);
  transaction.domain = domain;

  transaction.refreshTimeout();

  // If we are creating a transaction from an existing transaction, remove
  // the callback from the
  // if (typeof options.cancelTimeout === 'function') {
  //   options.cancelTimeout();
  // }


  return transaction
}
