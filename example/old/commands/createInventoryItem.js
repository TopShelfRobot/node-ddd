

exports = module.exports = function(domain) {

}


const schema = {};

function command(payload) {
  return InventoryRepo.get()
    .then(state => InventoryItem.create(payload.name, state))
    .then(state => InventoryItem.checkIn(config.defaultInventoryItemsNumber, state))
    .then(state => InventoryRepo.save(state) )
    .spread((state, events) => this.publishEvents(events).return([state, events]))
}
