import uuid from 'node-uuid';

function lineItemId() {
  return uuid.v4();
}

const invCommands = {
  createInvoice: function(payload, state, createEvent) {
    if (!payload.lineItems || !payload.lineItems.length) {
      throw new Error('Cannot create invoice. At least one line item required');
    }

    const events = [];
    const createEvt = createEvent('invoiceCreated', payload);
    const itemsEvts = payload.lineItems.map(li => createEvent('invoiceItemCreated', li));
    return events.concat(createEvt, itemsEvts);
  },

  addLineItem: function(payload, state, createEvent) {
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

  payInvoice: function(payload, state, createEvent) {
    if (invoice.status === 'Closed' || invoice.remaining <= 0) {
      throw new Error('Cannot make payment on a closed invoice or an invoice with no remaining balance');
    }

    const paymentToApply = Math.min(payment, invoice.remaining);
    const events = [];

    events.push( createEvent('invoicePaymentMade', {payment: paymentToApply}) );
    if (invoice.remaining === paymentToApply) {
      events.push( createEvent('invoiceClosed'))
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
