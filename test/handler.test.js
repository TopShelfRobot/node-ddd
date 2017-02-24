import assert from 'assert';
import CreateHandlerFactory from "../src/handler";


describe("Message Handler", () => {
  describe("creating a message handler factory", () => {
    it("returns a function", () => {
      const hf = CreateHandlerFactory();
      assert.equal(typeof hf, "function")
    })
  })

  describe("Message handler factory", () => {
    let CreateHandler;
    before() {
      CreateHandler = CreateHandlerFactory();
    }

    describe("Creating handlers", () => {

    })
  })
})
