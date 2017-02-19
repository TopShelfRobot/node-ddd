

const invEvents = {
  invoiceCreated: function(state, payload) {
    state.createDate = payload.createDate;
    state.invoiceDate = payload.invoiceDate;
    state.dueDate = payload.dueDate;
    state.status = 'Created';

    state.total = 0;
    state.remaining = 0;

    return state;
  },
  invoiceDelivered: function(state, payload) {
    state.status = 'Delivered';
  },
  invoicePaid: function(state, payload) {
    state.remaining -= payload.amount;
  },
  invoiceClosed: function(state, payload) {
    state.status = 'Closed';
  },
  invoiceItemCreated: function(state, payload, evt) {
    const newItem = InvoiceItem.project(evt);
    state.items.push(newItem);
    state.total += newItem.total;
    state.remaining += newItem.remaining;
  },
  invoiceItemDeleted: function(state, payload) {
  },
}

const invoiceEvents = [
  {name: 'invoiceCreated',      eventVersion: 1, callback: invEvents.invoiceCreated},
  {name: 'invoiceDelivered',    eventVersion: 1, callback: invEvents.invoiceDelivered},
  {name: 'invoicePaid',         eventVersion: 1, callback: invEvents.invoicePaid},
  {name: 'invoiceClosed',       eventVersion: 1, callback: invEvents.invoiceClosed},
  {name: 'invoiceItemCreated',  eventVersion: 1, callback: invEvents.invoiceItemCreated},
  {name: 'invoiceItemDeleted',  eventVersion: 1, callback: invEvents.invoiceItemDeleted},
];

export default invoiceEvents;
