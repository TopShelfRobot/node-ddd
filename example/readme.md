## Invoice Structure
```
{
  createDate: Date,       // Date the invoice was created
  invoiceDate: Date,      // Date the invoice is considered active
  dueDate: Date,          // Date by which the invoice should be paid
  status: String,         // Current status of the invoice

  total: Number,          // Total amount due for the invoice
  remaining: Number,      // Total remaining on the invoice after payments

  customer: String,       // Pays the invoice
  vendor: String,         // Creates the invoice

  items: [{
    description: String,  // Line item description
    quantity: Number,     // Quantity of items included on this line
    price: Number,        // Price of each item
    total: Number,        // Total due for this line item
  }]  
}
```

## Events
| Event | Description |
| --- | --- |
| invoiceCreated | The invoice was created |
| invoiceDelivered | The invoice was delivered to the recipient |
| invoicePaid | A payment on the invoice was received |
| invoiceClosed | All payments on the invoice have been made |
| invoiceItemCreated | An invoice item was added |
| invoiceItemDeleted | An invoice item was deleted |
