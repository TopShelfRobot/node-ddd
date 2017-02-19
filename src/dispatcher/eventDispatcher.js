import fs from 'fs';
import path from 'path';
import {BaseDispatcherPrototype} from './baseDispatcher';
import CreateEventHandler from './eventHandler';



const EventDispatcher = {

  onEvent: function(events) {
    return this.createEventHandler(cmd);
  },
  createEventHandler: function(cmd) {
    return this.createHandler(cmd);
  },
  addEvent: function(evtDef) {
    return this.addEvents(evtDef)[0];
  },
  addEvents: function(events) {
    if (!Array.isArray(events)) events = [events];
    return events.map(evt => this.createHandler(evt));
  },
  getEventHandler: function(cmd) {
    return this.getHandler(cmd);
  },
  execute: function(...args) {
    return this.applyHandler.apply(this, args);
  },
  _initDispatcher: function(options) {
    BaseDispatcherPrototype._initDispatcher.call(this, options);
  },

}


export const EventDispatcherPrototype = Object.assign({}, BaseDispatcherPrototype, EventDispatcher );
const EventDispatcherOptions = {
  collection: '_eventHandlers',
  handlerFactory: CreateEventHandler,
}

export default function CreateEventDispatcher(options={}) {
  options = Object.assign({}, EventDispatcherOptions, options);
  const eventDispatcher = Object.create(EventDispatcherPrototype);

  eventDispatcher._initDispatcher(options);

  return eventDispatcher;
}
