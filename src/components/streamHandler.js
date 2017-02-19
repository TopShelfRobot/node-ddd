




const StreamHandler = {
  setStream(stream) {
    this.stream = stream;
    this.onVersion = stream.getVersion();
    return this;
  },
  getStream() {
    return this.stream;
  },
  getNewEvents() {
    return this.stream.getEvents(this.onVersion);
  },
  getSnapshot() {
    return this.stream.snapshot.getData();
  },
  getSnapshotVersion() {
    return this.stream.snapshot.getVersion();
  },
  /**
  * Sets the `onVersion` property to the last version in the stream
  * @return {Stream} This Stream object
  */
  consumeAllEvents: function() {
    this.onVersion = this.stream.getVersion();
  },

  enhanceEvent(evt) {
    evt.meta = Object.assign(evt.meta || {}, this.eventMeta);
    return evt;
  },
  /**
   * Adds an event to the stream
   *
   * @param  {Object} evt An event to add
   * @return {Stream}     This Stream option
   */
  addEvents: function(events) {
    events = events.map(evt => this.enhanceEvent(evt))
    this.stream.addEvents(events);
    return this;
  },
};


const StreamHandlerPrototype = Object.assign({}, StreamHandler);

export default function CreateStreamHandler(options) {
  const streamHandler = Object.create(StreamHandlerPrototype);

  streamHandler.stream = null;
  streamHandler.onVersion = 0;
  streamHandler.eventMeta = options.meta || {};

  return streamHandler;
}
