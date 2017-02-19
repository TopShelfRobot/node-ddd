import Aggregate from '../src/aggregate.js';
import {InvalidOperationError} from '../src/errors';
import {curry} from '../src/utils';

const Inventory = Aggregate('inventory', {
  InventoryItemCreated: function(payload, state) {
    return Object.assign({}, state, {activated: true, name: payload.name});
  },

  InventoryItemRenamed: function(payload, state) {
    return Object.assign({}, state, {name: payload.name});
  },

  ItemsCheckedInToInventory: function(payload, state) {
    return Object.assign({}, state, {number: state.number + payload.numberOfItems})
  },

  ItemsCheckedOutFromInventory: function(payload, state) {
    return Object.assign({}, state, {number: state.number - payload.numberOfItems})

  },

  InventoryItemDeactivated: function(payload, state) {
    return Object.assign({}, state, {activated: false});
  },
});



Inventory.command("create", function(name, state) {
  return this.createEvent('InventoryItemCreated', {name}, state);
});

Inventory.command("checkIn", function(numberOfItems, state) {
  return this.createEvent('ItemsCheckedInToInventory', {numberOfItems}, state);
});

Inventory.command("checkOut", function(numberOfItems, state) {
  if ((state.number - numberOfItems) < 0) {
    throw new InvalidOperationError(`The inventory needs to replenished in order to checkout ${numberOfItems} items.`);
  }

  return this.createEvent('ItemsCheckedOutFromInventory', {numberOfItems}, state);
});

Inventory.command("deactivate", function(state) {
  if (!state.activated) {
    throw new InvalidOperationError('This inventory item has already been deactivated.');
  }

  return this.createEvent('InventoryItemDeactivated', {}, state);
});

Inventory.command("rename", function(name, state) {
  return this.createEvent('InventoryItemRenamed', {name}, state)
});

Inventory.initialState({
  name: null,
  activated: false,
  number: 0,
})

// Inventory.onEvent('InventoryItemCreated', function(payload, state) {
//   return Object.assign({}, state, {activated: true, name: payload.name});
// });
//
// Inventory.onEvent('InventoryItemRenamed', function(payload, state) {
//   return Object.assign({}, state, {name: payload.name});
// });
//
// Inventory.onEvent('ItemsCheckedInToInventory', function(payload, state) {
//   return Object.assign({}, state, {number: state.number + payload.numberOfItems})
// });
//
// Inventory.onEvent('ItemsCheckedOutFromInventory', function(payload, state) {
//   return Object.assign({}, state, {number: state.number - payload.numberOfItems})
//
// });
//
// Inventory.onEvent('InventoryItemDeactivated', function(payload, state) {
//   return Object.assign({}, state, {activated: false});
// });

export default Inventory;
