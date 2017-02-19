// example/domain.js
import path from 'path';
import {CreateDomain, CreateRepository} from '../src'

import {invoiceAggregate} from './invoice';


export default function(eventStore) {

  const repository = CreateRepository(eventStore);
  const domain = CreateDomain({ name: 'invoice', });

  domain.useRepository(repository);
  domain.addAggregate(invoiceAggregate);

  return domain.init();
}
