import util from 'util';

export function ValidationError(message, validationErrors) {
  validationErrors = validationErrors || [];
  if (!Array.isArray(validationErrors)) validationErrors = [validationErrors];
  
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name;

  if (validationErrors && validationErrors.length) {
    message = message + '\n\t' + validationErrors.join('\n\t');
  }

  this.message = message;
}
util.inherits(ValidationError, Error);


export function CommandNotFound(commandType) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name;
  this.message = `No such command '${commandType}'`;
  this.status = 404;
}
util.inherits(CommandNotFound, Error);

export function InvalidOperationError(message) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name;
  this.message = message;
  this.status = 400;
}
util.inherits(InvalidOperationError, Error);
