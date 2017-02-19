// errors/validationError.js

export default function ValidationError(shortMessage, validationErrors) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.shortMessage = shortMessage;
  this.message = `${shortMessage}\n\t${validationErrors.join('\n\t')}`;
};

require('util').inherits(ValidationError, Error);
