import moment from 'moment';

const EventPrototype = {
  extendMeta: function(...args) {
    this.meta = Object.assign.apply(Object, [{}, this.meta].concat(args));
    return this;
  }
}


export default function CreateEvent(name, eventVersion, payload, meta) {
  const evt = Object.create(EventPrototype);
  Object.assign(evt, {
    name, eventVersion, payload, meta,
    createDate: moment().format()   // ISO 8601
  });
  return evt;
}
