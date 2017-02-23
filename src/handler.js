const tv4 = require('tv4');
const _capitalize = require('lodash/capitalize');


const Handler = {
  validateConfig(config) {
    const validationErrors = [];
    const requiredFields = [this.nameProperty, this.versionProperty, 'callback'];
    const missingFields = requiredFields.filter(fld => !config.hasOwnProperty(fld));

    if (missingFields.length) {
      validationErrors.push(`Missing required fields for ${capitalMessageType} handler: [${missingFields.join(',')}]`);
    }

    return validationErrors;
  },

  _validateMessage(message) {
    const validationErrors = [];
    // Does the name match?
    // Note: We don't need to validate the version since the handler registry
    // decides which handler version is appropriate to use
    if (message[this.nameProperty] !== this[this.nameProperty]) {
      validationErrors.push(`${this.capitalMessageType} name ('${message[this.nameProperty]}') does not match the handler name ('${this[this.nameProperty]}')`)
    }

    // Does the message have a payload?
    if (!message.payload) {
      validationErrors.push(`'${this.capitalMessageType}' is missing a payload object`);
    } else {
      const result = tv4.validateMultiple(message.payload, this.payloadSchema);

      if (!result.valid) {
        result.missing.forEach(m => validationErrors.push(`Missing ${m}`));
        result.errors.forEach (err => validationErrors.push(`${err.message} - Path: '${err.dataPath}'`))
      }
    }

    return validationErrors;
  },

  getVersion() { return this[this.versionProperty] },
  getName() {return this[this.nameProperty] },

  execute(...args) {
    return this.config.callback.apply(this, args);
  },

}


export default function CreateHandlerFactory(options) {
  const messageType     = options.messageType || 'message';
  const versionProperty = options.versionProperty || 'version';
  const nameProperty    = options.nameProperty || 'name';
  const capitalMessageType = _capitalize(messageType);

  return function CreateHandler(config) {
    const handler = Object.create(Handler);

    Object.assign(handler, {
      messageType,
      capitalMessageType,
      versionProperty,
      nameProperty,
      config,
      payloadSchema: {type: 'object'},
      [nameProperty]: options[nameProperty],
      [versionProperty]: options[versionProperty],
      [`validate${capitalMessageType}`] = handler._validateMessage.bind(handler);
    })

    if (config.schema) {
      handler.payloadSchema = Object.assign(handler.payloadSchema, config.schema);
    }

    return handler;

  }
}
