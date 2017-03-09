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
      const cmd = domain.createCommand('test1', 1, {
        aggregateId: 'abc',
        payload: {a:1},
        meta: {b:2}
      });
      expect(cmd).to.be.ok;
      expect(cmd.name).to.equal('test1');
      expect(cmd.commandVersion).to.equal(1);
      expect(cmd.payload).to.deep.equal({a:1});
      expect(cmd.meta).to.have.property('b')
    });

    it('commandVersion defaults to the most recent version', () => {
      const cmd = domain.createCommand('test2', {
        aggregateId: 'abc',
        payload: {a:1},
        meta: {b:2}
      });

      expect(cmd).to.be.ok;
      expect(cmd.commandVersion).to.equal(2);
    })

  })


  describe("schemas", () => {
    it('validates a valid event schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name   : {type: 'string'},
          payload: {type: 'object'},
        }
      }

      const domain = CreateDomain('tester');
      assert.ok(domain.isValidEventSchema(schema));
    })

    it('catches invalid event schemas', () => {
      const domain = CreateDomain('tester');
      const schema = { type: 'object', properties: {
          name   : {type: 'string'},
          payload: {type: 'object'},
        }
      }

      assert.ok(!domain.isValidEventSchema({
        type: 'object',
        properties: {
          // name   : {type: 'string'},
          payload: {type: 'object'},
        }
      }), 'Missing Name');

      assert.ok(!domain.isValidEventSchema({
        type: 'object',
        properties: {
          name   : {type: 'string'},
          // payload: {type: 'object'},
        }
      }), 'Missing Payload');

      assert.ok(!domain.isValidEventSchema({
        type: 'object',
        properties: {
          name   : {type: 'number'},
          payload: {type: 'object'},
        }
      }), 'Wrong Type of name');

      assert.ok(!domain.isValidEventSchema({
        type: 'object',
        properties: {
          name   : {type: 'string'},
          payload: {type: 'number'},
        }
      }), 'Wrong Type of payload');



    })
  })


});
