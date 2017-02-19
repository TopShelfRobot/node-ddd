import Moment from 'moment';


const Projectionist = {
  listen: function() {
    this._subscribeProjectionToEvents()
    this._setStartTime();
  },

  getStatus: function() {
    return this._status();
  },

  _subscribeProjectionToEvents: function() {
    const eventTypes = this.projection.getEventTypes();
    // subscribe to each topic
  },

  _handleProjectionError: function(errMessage) {
    const {error, event} = errMessage;
    // Log the error
    this._addError(error, event);
    // Is this a fatal error requiring a shutdown
    // move along
  },

  /**
   * Resets a hash to default values.  The hash holds current information on the
   * health and status of the projection.  This will also create the status hash
   * if it does not exist.
   *
   * If being created, status.startTime is set to the current time.  Otherwise,
   * startTime is carried forward from the previous status.
   *
   * @return {undefined} No return value
   */
  resetStatus: function() {
    const now = Moment().format();
    const startTime = (this._status && this._status.startTime) ? this._status.startTime : now;
    this._status = {
      name: this.name,
      startTime: startTime,
      statusBegin: now,
      completed: 0,
      skipped: 0,
      errors: []
    };
  },
  _incrementCompleted: function() { this._status.completed += 1; },
  _incrementSkipped: function() { this._status.skipped += 1; },
  _addError: function(err, evt) {
    this._status.errors.push({
      timeStamp: Moment().format(),
      message: err.message,
      event: evt
    });
  },
};


const ProjectionistProto = Object.assign({}, Projectionist);


export default function CreateProjectionist(projection) {
  if (!projection) {
    throw new Error(`Missing 'projection' argument`);
  }

  const projectionist = Object.create(ProjectionistProto);
  const self = projectionist;

  self.name = projection.name;
  self.resetStatus();

  // ---------------------------------------------------------------------------
  // Respond to projection events
  self.projection.on('start_event', function() { });
  self.projection.on('end_event', function() {
    self._incrementCompleted();
  });
  self.projection.on('error', self._handleProjectionError.bind(self))
}
