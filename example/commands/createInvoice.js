import uuid from 'node-uuid';

const command = {
  name: 'createInvoice',
  version: 1,
  handle: function(command) {
    const aggregateId = uuid.v4();
    const Invoice = this.aggregate('invoice');

    return this.repository('invoice')
      .get(aggregateId)
      .then(stream => Invoice.execute(command, stream));
  }
}

exports = module.exports = command;
