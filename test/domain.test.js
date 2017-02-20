import {expect} from 'chai';
import assert from 'assert';
import CreateDomain from '../src/domain';

describe('Domain', () => {
  describe('creating a domain', () => {
    it('creates a domain object', () => {
      const d = CreateDomain();
      expect(d).to.be.ok;
    });
    it('creates a domain with object-only arguments', () => {
      const d = CreateDomain({name: 'myDomain'});
      assert.equal(d.name, 'myDomain');
    });
    it('creates a domain with string as name', () => {
      const d = CreateDomain('myDomain', {});
      assert.equal(d.name, 'myDomain');
    });
  });

  describe('createCommand()', () => {
    let domain;
    let test1Result, test2v1Result, test2v2Result;
    before(done => {
      domain = CreateDomain({
        commands: [
          {name: 'test1', commandVersion: 1, callback: function() { test1Result = true; }},
          {name: 'test2', commandVersion: 1, callback: function() { test2v1Result = true; }},
          {name: 'test2', commandVersion: 2, callback: function() { test2v2Result = true; }},
        ]
      });
      done();
    });

    it('creates a valid command', () => {
      const cmd = domain.createCommand('test1', 1, {a:1}, {b:2});
      expect(cmd).to.be.ok;
      expect(cmd.name).to.equal('test1');
      expect(cmd.commandVersion).to.equal(1);
      expect(cmd.payload).to.deep.equal({a:1});
      expect(cmd.meta).to.have.property('b')
    });

    it('commandVersion defaults to the most recent version', () => {
      const cmd = domain.createCommand('test2', {a:1}, {b:2});
      expect(cmd).to.be.ok;
      expect(cmd.commandVersion).to.equal(2);
    })

  })
});
