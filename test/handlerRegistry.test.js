import assert from 'assert';
import {expect} from 'chai';
import {CreateRegistry} from '../src/messageHandler';
import {ValidationError} from '../src/messageHandler/errors';

describe('handlerRegistry', () => {
  describe('creating a registry', () => {
    it('creates a valid registry', () => {
      const reg = CreateRegistry();
      expect(reg.messageRegistry).to.be.ok;
    })

    it('renames functions', () => {
      const reg = CreateRegistry({messageType: 'bla'});
      expect(reg.registerBlaHandler).to.be.a('function');
      expect(reg.registerBlaHandlers).to.be.a('function');
      expect(reg.blaRegistry).to.be.ok;
    })
  })

  describe('registering a handler', () => {
    it('registers a valid handler', () => {
      const reg = CreateRegistry();
      const handler = {name: 'tester', version: 1, callback: () => {}};

      expect(reg.getMessageHandlers()).to.have.length(0);
      reg.loadMessageHandler(handler);
      expect(reg.getMessageHandlers()).to.have.length(1);
    })

    it('registers an array of valid handlers', () => {
      const reg = CreateRegistry();
      const handlers = [
        {name: 'tester1', version: 1, callback: () => {}},
        {name: 'tester2', version: 1, callback: () => {}},
        {name: 'tester3', version: 1, callback: () => {}},
      ]

      expect(reg.getMessageHandlers()).to.have.length(0);
      reg.loadMessageHandlers(handlers);
      expect(reg.getMessageHandlers()).to.have.length(3);

    })

  })

  describe('getting a handler', () => {
    it("gets a specific version of a handler", () => {
      const reg = CreateRegistry();
      const handlers = [
        {name: 'tester', version: 1, value: 'a', callback: () => {}},
        {name: 'tester', version: 2, value: 'b', callback: () => {}},
        {name: 'tester', version: 3, value: 'c', callback: () => {}},
      ];
      reg.loadMessageHandlers(handlers);

      expect(reg.getMessageHandler({name: 'tester', version:1}).config.value).to.equal('a');
      expect(reg.getMessageHandler({name: 'tester', version:2}).config.value).to.equal('b');
      expect(reg.getMessageHandler({name: 'tester', version:3}).config.value).to.equal('c');
    })

    it("gets default handler via 'strict' strategy", () => {
      const reg = CreateRegistry({defaultVersion: 'strict'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a', callback: () => {}},
        {name: 'tester', version: 2, value: 'b', callback: () => {}},
        {name: 'tester', version: 6, value: 'c', callback: () => {}},
        {name: 'tester', version: 7, value: 'd', callback: () => {}},
      ];
      reg.loadMessageHandlers(handlers);

      const handler = reg.getMessageHandler({name: 'tester', version: 5, callback: () => {}});
      expect(handler).to.not.be.ok;
    })
    it("gets default handler via 'latest-version' strategy", () => {
      const reg = CreateRegistry({defaultVersion: 'latest-version'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a', callback: () => {}},
        {name: 'tester', version: 2, value: 'b', callback: () => {}},
        {name: 'tester', version: 6, value: 'c', callback: () => {}},
        {name: 'tester', version: 7, value: 'd', callback: () => {}},
      ];
      reg.loadMessageHandlers(handlers);

      const handler = reg.getMessageHandler({name: 'tester', version: 5, callback: () => {}});
      expect(handler).to.be.ok;
      expect(handler.config.value).to.equal('d');
    })
    it("gets default handler via 'first-version' strategy", () => {
      const reg = CreateRegistry({defaultVersion: 'first-version'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a', callback: () => {}},
        {name: 'tester', version: 2, value: 'b', callback: () => {}},
        {name: 'tester', version: 6, value: 'c', callback: () => {}},
        {name: 'tester', version: 7, value: 'd', callback: () => {}},
      ];
      reg.loadMessageHandlers(handlers);

      const handler = reg.getMessageHandler({name: 'tester', version: 5, callback: () => {}});
      expect(handler).to.be.ok;
      expect(handler.config.value).to.equal('a');
    })
    it("gets default handler via 'previous' strategy", () => {
      const reg = CreateRegistry({defaultVersion: 'previous'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a', callback: () => {}},
        {name: 'tester', version: 2, value: 'b', callback: () => {}},
        {name: 'tester', version: 6, value: 'c', callback: () => {}},
        {name: 'tester', version: 7, value: 'd', callback: () => {}},
      ];
      reg.loadMessageHandlers(handlers);

      const handler = reg.getMessageHandler({name: 'tester', version: 5, callback: () => {}});
      expect(handler).to.be.ok;
      expect(handler.config.value).to.equal('b');
    })
    it("gets default handler via 'next' strategy", () => {
      const reg = CreateRegistry({defaultVersion: 'next'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a', callback: () => {}},
        {name: 'tester', version: 2, value: 'b', callback: () => {}},
        {name: 'tester', version: 6, value: 'c', callback: () => {}},
        {name: 'tester', version: 7, value: 'd', callback: () => {}},
      ];
      reg.loadMessageHandlers(handlers);

      const handler = reg.getMessageHandler({name: 'tester', version: 5, callback: () => {}});
      expect(handler).to.be.ok;
      expect(handler.config.value).to.equal('c');
    })

  });

  describe('name and version alias', () => {
    it('aliases the version property', () => {
      const messageType = 'event';
      const versionProperty = 'eventVersion'
      const reg = CreateRegistry({messageType, versionProperty});

      expect(reg.getEventHandlers()).to.have.length(0);

      const willThrow = () => reg.loadEventHandler({name: 'evt1', version: 1, callback: () => {}});
      expect(willThrow).to.throw(Error);

      expect(reg.getEventHandlers()).to.have.length(0);
      reg.loadEventHandler({name: 'evt1', eventVersion: 1, callback: () => {}});
      expect(reg.getEventHandlers()).to.have.length(1);
    })
    it('aliases the NAME property', () => {
      const messageType = 'event';
      const nameProperty = 'type'
      const reg = CreateRegistry({messageType, nameProperty});

      expect(reg.getEventHandlers()).to.have.length(0);

      const willThrow = () => reg.loadEventHandler({name: 'evt1', version: 1, callback: () => {}});
      expect(willThrow).to.throw(Error);

      expect(reg.getEventHandlers()).to.have.length(0);
      reg.loadEventHandler({type: 'evt1', version: 1, callback: () => {}});
      expect(reg.getEventHandlers()).to.have.length(1);
    })
  })

  describe('message Schema definition', () => {
    it("defaults to a simple schema", () => {
      const reg = CreateRegistry();
      const expected = { type: 'object', allOf: [] };

      assert.deepEqual(reg.getMessageSchema(), expected);
    })

    it("extends the schema at construction", () => {
      const schema = {properties: {prop1: {type: 'string'}}}
      const reg = CreateRegistry({schema});
      const expected = { type: 'object', allOf: [schema] };

      assert.deepEqual(reg.getMessageSchema(), expected);
    })

    it("extends the schema at runtime", () => {
      const schema = {properties: {prop1: {type: 'string'}}}
      const schema2 = {properties: {prop2: {type: 'string'}}}
      const reg = CreateRegistry({schema});
      const expected = { type: 'object', allOf: [schema] };
      const expected2 = { type: 'object', allOf: [schema, schema2] };

      assert.deepEqual(reg.getMessageSchema(), expected);
      reg.extendMessageSchema(schema2)
      assert.deepEqual(reg.getMessageSchema(), expected2);
    })

    describe("validating message", () => {
      const baseSchema = {
        properties: {
          name: {type: 'string'},
          age: {type: 'number'},
        },
        required: ['name']
      }

      it("validates against a schema", () => {
        const reg = CreateRegistry({schema: baseSchema});
        const good = {name: 'test', age: 123};
        const wrongType = {name: 'test', age: '123'};
        const missingName = {age: 123};

        assert.equal(reg.validateMessage(good).length, 0);
        assert.equal(reg.validateMessage(wrongType).length, 1);
        assert.equal(reg.validateMessage(missingName).length, 1);
      })
    })

  })
})
