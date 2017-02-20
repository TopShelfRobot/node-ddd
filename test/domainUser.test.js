import assert from 'assert';
import {ConfigurationError} from '../src/errors';
import {CreateDomain} from '../src';
import DomainUser from '../src/components/domainUser';

describe("DomainUser", () => {
  describe("Creating a Domain User", () => {
    it("Creates a domain user with a specific name", () => {
      const du = DomainUser('myName');
      assert.equal(du._domainUser, 'myName');
    });

    it("puts all props on the returned object", () => {
      const du = DomainUser('myName');
      assert.ok(du.hasOwnProperty('_domainUser'));
      assert.ok(du.hasOwnProperty('useDomain'));
    })
  });

  describe("Behavior", () => {
    it("rejects using invalid domains", () => {
      const du = DomainUser('myName');
      const willThrow = () => du.useDomain('not a domain');
      assert.throws(willThrow, ConfigurationError);
    });

    it("sets a valid domain", () => {
      const domain = CreateDomain('myDomain');
      const du = DomainUser('myName');
      du.useDomain(domain);
      assert.strictEqual(du.getDomain(), domain);
    })

    it("rejects setting a domain twice", () => {
      const domain1 = CreateDomain('myDomain1');
      const domain2 = CreateDomain('myDomain2');
      const du = DomainUser('myName');
      du.useDomain(domain1);
      const willThrow = () => du.useDomain(domain2);
      assert.throws(willThrow, ConfigurationError);
    })

    it("separate domains are separate", () => {
      const domain1 = CreateDomain('myDomain1');
      const domain2 = CreateDomain('myDomain2');
      const du1 = DomainUser('myName1');
      const du2 = DomainUser('myName2');
      du1.useDomain(domain1);
      du2.useDomain(domain2);
      assert.notStrictEqual(du1.getDomain(), du2.getDomain());
    })
  })
})
