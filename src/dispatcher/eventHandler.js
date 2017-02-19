import {BaseHandlerPrototype} from './baseHandler';

const EventHandler = {
  _initHandler: function(options={}) {
    BaseHandlerPrototype._initHandler.call(this, options);
  }
}

const EventHandlerPrototype = Object.assign({}, BaseHandlerPrototype, EventHandler);

export default function CreateEventHandler(options={}) {
  const commandHandler = Object.create(EventHandlerPrototype);
  commandHandler._initHandler(options);
  return commandHandler;
}
