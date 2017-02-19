import {expect} from 'chai';
import createRegistry from '../src/handlerRegistry';
import ValidationError from '../src/errors';

describe('handlerRegistry', () => {
  describe('creating a registry', () => {
    it('creates a valid registry', () => {
      const reg = createRegistry();
      expect(reg.requestRegistry).to.be.ok;
    })

    it('renames functions', () => {
      const reg = createRegistry({name: 'bla'});
      expect(reg.registerBla).to.be.a('function');
      expect(reg.registerBlas).to.be.a('function');
      expect(reg.blaRegistry).to.be.ok;
    })
  })

  describe('registering a handler', () => {
    it('registers a valid handler', () => {
      const reg = createRegistry();
      const handler = {name: 'tester', version: 1};

      expect(reg.getRequestHandlers()).to.have.length(0);
      reg.registerRequest(handler);
      expect(reg.getRequestHandlers()).to.have.length(1);
    })

    it('registers an array of valid handlers', () => {
      const reg = createRegistry();
      const handlers = [
        {name: 'tester1', version: 1},
        {name: 'tester2', version: 1},
        {name: 'tester3', version: 1},
      ]

      expect(reg.getRequestHandlers()).to.have.length(0);
      reg.registerRequests(handlers);
      expect(reg.getRequestHandlers()).to.have.length(3);

    })

    it('throws an error when required data is missing', () => {
      const reg = createRegistry();
      const willThrow1 = () => reg.registerRequests({name: 'noVersion'});
      const willThrow2 = () => reg.registerRequests({version: 123});
      expect(willThrow1).to.throw(ValidationError);
      expect(willThrow2).to.throw(ValidationError);
    });
  })

  describe('getting a handler', () => {
    it("gets a specific version of a handler", () => {
      const reg = createRegistry();
      const handlers = [
        {name: 'tester', version: 1, value: 'a'},
        {name: 'tester', version: 2, value: 'b'},
        {name: 'tester', version: 3, value: 'c'},
      ];
      reg.registerRequests(handlers);

      expect(reg.getRequestHandler({name: 'tester', version:1}).value).to.equal('a');
      expect(reg.getRequestHandler({name: 'tester', version:2}).value).to.equal('b');
      expect(reg.getRequestHandler({name: 'tester', version:3}).value).to.equal('c');
    })

    it("gets default handler via 'strict' strategy", () => {
      const reg = createRegistry({defaultVersion: 'strict'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a'},
        {name: 'tester', version: 2, value: 'b'},
        {name: 'tester', version: 6, value: 'c'},
        {name: 'tester', version: 7, value: 'd'},
      ];
      reg.registerRequests(handlers);

      const handler = reg.getRequestHandler({name: 'tester', version: 5});
      expect(handler).to.not.be.ok;
    })
    it("gets default handler via 'latest-version' strategy", () => {
      const reg = createRegistry({defaultVersion: 'latest-version'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a'},
        {name: 'tester', version: 2, value: 'b'},
        {name: 'tester', version: 6, value: 'c'},
        {name: 'tester', version: 7, value: 'd'},
      ];
      reg.registerRequests(handlers);

      const handler = reg.getRequestHandler({name: 'tester', version: 5});
      expect(handler).to.be.ok;
      expect(handler.value).to.equal('d');
    })
    it("gets default handler via 'first-version' strategy", () => {
      const reg = createRegistry({defaultVersion: 'first-version'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a'},
        {name: 'tester', version: 2, value: 'b'},
        {name: 'tester', version: 6, value: 'c'},
        {name: 'tester', version: 7, value: 'd'},
      ];
      reg.registerRequests(handlers);

      const handler = reg.getRequestHandler({name: 'tester', version: 5});
      expect(handler).to.be.ok;
      expect(handler.value).to.equal('a');
    })
    it("gets default handler via 'previous' strategy", () => {
      const reg = createRegistry({defaultVersion: 'previous'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a'},
        {name: 'tester', version: 2, value: 'b'},
        {name: 'tester', version: 6, value: 'c'},
        {name: 'tester', version: 7, value: 'd'},
      ];
      reg.registerRequests(handlers);

      const handler = reg.getRequestHandler({name: 'tester', version: 5});
      expect(handler).to.be.ok;
      expect(handler.value).to.equal('b');
    })
    it("gets default handler via 'next' strategy", () => {
      const reg = createRegistry({defaultVersion: 'next'});
      const handlers = [
        {name: 'tester', version: 1, value: 'a'},
        {name: 'tester', version: 2, value: 'b'},
        {name: 'tester', version: 6, value: 'c'},
        {name: 'tester', version: 7, value: 'd'},
      ];
      reg.registerRequests(handlers);

      const handler = reg.getRequestHandler({name: 'tester', version: 5});
      expect(handler).to.be.ok;
      expect(handler.value).to.equal('c');
    })

  });

  describe('name and version alias', () => {
    it('aliases the version property', () => {
      const name = 'event';
      const versionProperty = 'eventVersion'
      const reg = createRegistry({name, versionProperty});

      expect(reg.getEventHandlers()).to.have.length(0);

      const willThrow = () => reg.registerEvent({name: 'evt1', version: 1});
      expect(willThrow).to.throw(Error);

      expect(reg.getEventHandlers()).to.have.length(0);
      reg.registerEvent({name: 'evt1', eventVersion: 1});
      expect(reg.getEventHandlers()).to.have.length(1);
    })
    it('aliases the NAME property', () => {
      const name = 'event';
      const nameProperty = 'type'
      const reg = createRegistry({name, nameProperty});

      expect(reg.getEventHandlers()).to.have.length(0);

      const willThrow = () => reg.registerEvent({name: 'evt1', version: 1});
      expect(willThrow).to.throw(Error);

      expect(reg.getEventHandlers()).to.have.length(0);
      reg.registerEvent({type: 'evt1', version: 1});
      expect(reg.getEventHandlers()).to.have.length(1);
    })
  })
})
