import Promise from 'bluebird';
import _zipObject from 'lodash/zipObject';


const ProjectionBox = {
  $init: function() {
    this.projectors_direct = [];
    this.projectors_mq = [];
  },

  /**
   * Pushes an event on to the message bus(es)
   *
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
   */
  send: function(event) {
    const directProjectorData = (this.projectors_direct.length)
      ? this._sendToDirect(event)
      : Promise.resolve();

    // TODO: send to Message Queue

    return Promise.all([directProjectorData])
      .spread((data) => {data});
  },

  _sendToDirect: function(event) {
    const projectorNames = this.projectors_direct.map(proj => proj.name);
    const projectorValues = Promise.map(this.projectors_direct, projector => {
      return projector.handleEvent(event);
    });

    return Promise.all([projectorNames, projectorValues])
      .spread((projectorNames, projectorValues) => {
        return _zipObject(projectorNames, projectorValues);
      });
  },



  /**
   * Connects to a RabbitMQ service
   *
   * When the ProjectorBox connects to a message queue, it also listens on it
   *
   * @param {string} Url of the MQ Service
   * @return {[type]} [description]
   */
  connect: function(amqpUrl) {

  },

  listen: function() {

  },

  directProjection: function(projection) {
    this.projectors_direct.push(projection);
  },
  subscribeProjection: function(projection) {
    this.projectors_direct.push(projection);
  },



};

const ProjectionBoxProto = Object.assign({},
  ProjectionBox
);

export default function CreateProjectionBox(options) {
  const pb = Object.create(ProjectionBoxProto);
  pb.init();
  return pb;
}
