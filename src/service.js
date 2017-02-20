import DomainUser from './components/domainUser';


export default CreateService(name, methods={}, options={}) {
  const service = Object.assign({}, DomainUser(`Service ${name}`, methods);

  if (options.domain) service.useDomain(domain);

  return service;
}
