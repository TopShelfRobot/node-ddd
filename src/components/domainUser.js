import {isValidDomain} from '../domain';
import {ConfigurationError} from '../errors';

const useDomain = function(domain) {
  if (this.domain) {
    throw new ConfigurationError(`'${this._domainUser}': Domain has already been set`);
  }

  if (!isValidDomain(domain)) {
    throw new ConfigurationError(`'${this._domainUser}': Please pass a valid domain`)
  }

  this.domain = domain;
}

const getDomain = function() {
  return this.domain;
}


export default function domainUser(domainUserDescriptor) {
  return {
    _domainUser: domainUserDescriptor || 'Domain User',
    useDomain  : useDomain,
    getDomain  : getDomain
  }
}
