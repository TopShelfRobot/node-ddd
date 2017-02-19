import {CreateAggregate} from '../../src/';


import events from './events';
import commands from './commands';


export const invoiceAggregate = CreateAggregate('invoice', {commands, events});
