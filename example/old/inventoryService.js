import CommandHandler from '../src/commandHandler';
import Repository from '../src/repository';
import {series} from '../src/utils';
import InventoryItem from './inventoryAggregate';


export default function(eventStore, config) {
  const InventoryRepo = Repository(InventoryItem, eventStore);

  const InventoryCommands = CommandHandler('inventory', {
    createInventoryItem: function(payload) {
      return InventoryRepo.get()
        .then(state => InventoryItem.create(payload.name, state))
        .then(state => InventoryItem.checkIn(config.defaultInventoryItemsNumber, state))
        .then(state => InventoryRepo.save(state) )
        .spread((state, events) => this.publishEvents(events).return([state, events]))
    },

    renameInventoryItem: function(payload) {
      return InventoryRepo.get(payload.inventoryItemId)
        .then(state => InventoryItem.rename(payload.name, state))
        .then(state => InventoryRepo.save(state) )
        .spread((state, events) => this.publishEvents(events).return([state, events]))
    },

    checkinItemsInToInventory: function(payload) {
      return InventoryRepo.get(payload.inventoryItemId)
        .then(state => InventoryItem.checkIn(payload.numberOfItems, state))
        .then(state => InventoryRepo.save(state) )
        .spread((state, events) => this.publishEvents(events).return([state, events]))
    },

    checkoutItemsFromInventory: function(payload) {
      return InventoryRepo.get(payload.inventoryItemId)
        .then(state => InventoryItem.checkOut(payload.numberOfItems, state))
        .then(state => InventoryRepo.save(state) )
        .spread((state, events) => this.publishEvents(events).return([state, events]))
    },

    deactivateInventoryItem: function(payload) {
      return InventoryRepo.get(payload.inventoryItemId)
        .then(state => InventoryItem.deactivate(state))
        .then(state => InventoryRepo.save(state) )
        .spread((state, events) => this.publishEvents(events).return([state, events]))
    },

  });

  return {
    command: function(command) {
      return InventoryCommands.handleCommand(command);
    },
    repository: InventoryRepo
  };

}
