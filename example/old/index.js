import InventoryService from './inventoryService';
import InMemory from '../src/eventStore/inMemory';


const config = {
  defaultInventoryItemsNumber: 15
}

export default function(config) {
  const eventStore = new InMemory();
  const inventoryService = InventoryService(eventStore, config);

  return {
    receiveCommand: function(command) {
      return inventoryService.command(command);
    },
    reset: function() {
      eventStore.reset();
    },
    dumpEventStore: function() {
      return eventStore.dump();
    },
    getRepository: function() {
      return inventoryService.repository;
    }
  };
}
