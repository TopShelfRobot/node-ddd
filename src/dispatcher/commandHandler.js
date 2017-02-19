import {BaseHandlerPrototype} from './baseHandler';

const CommandHandler = {
  _initHandler: function(options={}) {
    BaseHandlerPrototype._initHandler.call(this, options);
  }
}

const CommandHandlerPrototype = Object.assign({}, BaseHandlerPrototype, CommandHandler);

export default function CreateCommandHandler(options={}) {
  const commandHandler = Object.create(CommandHandlerPrototype);
  commandHandler._initHandler(options);
  return commandHandler;
}
