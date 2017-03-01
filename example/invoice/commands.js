import uuid from 'node-uuid';

function lineItemId() {
  return uuid.v4();
}

const invCommands = {
  createInvoice: function(cmd, state, agg) {
    const {payload} = cmd;
    if (!payload.lineItems || !payload.lineItems.length) {
      throw new Error('Cannot create invoice. At least one line item required');
    }

    const events = [];
    const createEvt = agg.createEvent('invoiceCreated', payload);
    const itemsEvts = payload.lineItems.map(li => agg.createEvent('invoiceItemCreated', li));
    return events.concat(createEvt, itemsEvts);
  },

  addLineItem: function(cmd, state, agg) {
    if (invoice.status === 'Closed') {
      throw new Error(`Cannot add a line item to a closed invoice`)
    }

    cmd.payload = {
      id         : lineItemId(),
      description: payload.description,
      quantity   : payload.quantity || 0,
      price      : payload.price || 0,
      total      : payload.total || payload.quantity * payload.price,
    }
    return InvoiceItem.handle(cmd);
  },

  payInvoice: function(cmd, state, agg) {
    if (invoice.status === 'Closed' || invoice.remaining <= 0) {
      throw new Error('Cannot make payment on a closed invoice or an invoice with no remaining balance');
    }

    const paymentToApply = Math.min(payment, invoice.remaining);
    const events = [];

    events.push( agg.createEvent('invoicePaymentMade', {payment: paymentToApply}) );
    if (invoice.remaining === paymentToApply) {
      events.push( agg.createEvent('invoiceClosed'))
    }

    return events;
  }
}

const commandHandlers = [
  { name: 'createInvoice',  commandVersion: 1, callback: invCommands.createInvoice },
  { name: 'addLineItem',    commandVersion: 1, callback: invCommands.addLineItem },
  { name: 'payInvoice',     commandVersion: 1, callback: invCommands.payInvoice },
];

export default commandHandlers;
