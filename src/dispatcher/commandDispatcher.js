import fs from 'fs';
import path from 'path';
import {BaseDispatcherPrototype} from './baseDispatcher';
import CreateCommandHandler from './commandHandler';



const CommandDispatcher = {
  createCommandHandler: function(cmd) {
    return this.createHandler(cmd);
  },
  getCommandHandler: function(cmd) {
    return this.getHandler(cmd);
  },
  execute: function(...args) {
    return this.applyHandler.apply(this, args);
  },
  /**
   * Search a directory for commands and load them in to the hander
   *
   * This is a synchronous method
   *
   * @param  {String} dir The directory to search
   * @return {[type]}     [description]
   */
  loadCommands: function(dir) {
    return fs.readdirSync(dir)
      .filter(filename => /\.js$/.test(filename))
      .map(filename => {
        const cmd = require(path.join(dir, filename));
        cmd.name = cmd.name || filename.slice(0, -3);
        return cmd;
      })
      // The contents of each command file could be an Array
      // of commands.  Concat all values to flatten the array
      .reduce((allCmds, contents) => allCmds.concat(contents), [])
      .map(cmd => this.addCommand(cmd) );
  },

  _initDispatcher: function(options) {
    BaseDispatcherPrototype._initDispatcher.call(this, options);
  },

}


const CommandDispatcherPrototype = Object.assign({}, BaseDispatcherPrototype, CommandDispatcher );
const CommandDispatcherOptions = {
  collection: '_commands',
  handlerFactory: CreateCommandHandler,
}

export default function CreateCommandDispatcher(options={}) {
  options = Object.assign({}, CommandDispatcherOptions, options);
  const commandDispatcher = Object.create(CommandDispatcherPrototype);

  commandDispatcher._initDispatcher(options);

  return commandDispatcher;
}
