import _isObject from 'lodash/isObject';
import DomainUser from '../components/domainUser';


export default function CreateService(name, methods={}, options={}) {
  const service = Object.assign({},
    DomainUser(`Service ${name}`),
    methods
  );

  service.name = name;
  if (options.domain) service.useDomain(domain);

  return service;
}


export function isValidService(service) {
  return _isObject(service)
    && typeof service.useDomain === 'function'
    && typeof service.name === 'string';
}
