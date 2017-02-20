import assert from 'assert';
import {CreateDomain, CreateService} from '../src';

describe("Domain Services", () => {
  describe("Creating a service", () => {
    it("is a domain user", () => {
      const serv = CreateService('test');
      assert.equal(typeof serv.useDomain, 'function');
    })

    it("assigns methods", () => {
      const serv = CreateService('methodTest', {
        getName: function() {return this.name; },
      });

      assert.equal(typeof serv.getName, 'function');
      assert.equal(serv.getName(), 'methodTest');
    })
  });

  describe("Interaction with domain", () => {
    it("can be registered to a domain", () => {
      const domain = CreateDomain('myDomain');
      const service = CreateService('myService', {
        getName: function() {return this.name; },
        getDomainName: function() { return this.getDomain().name; },
      });

      domain.addService(service);
      assert.strictEqual(domain.service('myService'), service);
      assert.equal(domain.service('myService').getName(), 'myService');
      assert.equal(domain.service('myService').getDomainName(), 'myDomain');

    })
  })
})
