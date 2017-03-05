import assert from 'assert';
import Normalizer from '../src/components/normalizer';

describe("Normalizer", () => {
  describe("adds a schema", () => {
    it("creates a schema registry", () => {
      const norm = Object.create(Normalizer);
      const schema = {a:1};

      assert.ok(!norm._schemas);
      norm.addSchema('testSchema', schema);
      assert.ok(norm._schemas);
      assert.strictEqual(norm._schemas.testSchema, schema);
    })
  })

  describe("gets a schema", () => {
    it("gets a registered scheam", () => {
      const norm = Object.create(Normalizer);
      const schema = {a:1};

      norm.addSchema('tester', schema);
      assert.strictEqual(norm.getSchema('tester'), schema);
    })

    it("returns null when schema doesn't exist", () => {
      const norm = Object.create(Normalizer);
      const schema = {a:1};

      norm.addSchema('tester', schema);
      assert.ok(!norm.getSchema('idontexist'));

    })

    it("returns a passed object", () => {
      const norm = Object.create(Normalizer);
      const schema = {a:1};

      assert.strictEqual(norm.getSchema(schema), schema);
    })

    it("throws when requesting a non-string, non-object", () => {
      const norm = Object.create(Normalizer);
      const willThrow = () => norm.getSchema(123);
      assert.throws(willThrow);
    })
  })

  describe("normalize an object", () => {
    it("normalizes an object with deeply nested props", () => {
      const obj = {
        prop1: 'val1',
        deeply: {nested: {prop: 123}},
      };
      const schema = {
        type: 'object',
        properties: {
          'prop_1': {type: 'string', path: 'prop1'},
          'prop_2': {type: 'number', path: 'deeply.nested.prop'},
        }
      };
      const expected = {
        prop_1: 'val1',
        prop_2: 123,
      };
      const norm = Object.create(Normalizer);

      const normalized = norm.normalize(schema, obj);
      assert.deepEqual(normalized, expected);
    });
  });

  describe("denormalizes a record", () => {
    it("denormalizes a record with deeply nested props", () => {
      const record = {
        prop_1: 'val1',
        prop_2: 123,
      };
      const schema = {
        type: 'object',
        properties: {
          'prop_1': {type: 'string', path: 'prop1'},
          'prop_2': {type: 'number', path: 'deeply.nested.prop'},
        }
      };
      const expected = {
        prop1: 'val1',
        deeply: {nested: {prop: 123}},
      };
      const norm = Object.create(Normalizer);

      const denormalized = norm.denormalize(schema, record);
      assert.deepEqual(denormalized, expected);
    })

    it("gracefully returns record when schema is nil", () => {
      const record = {
        prop_1: 'val1',
        prop_2: 123,
      };
      const norm = Object.create(Normalizer);

      assert.deepEqual(norm.denormalize(null, record), record);
      assert.deepEqual(norm.denormalize(undefined, record), record);
    });

    it("gracefully returns null when record is null", () => {
      const record = null;
      const schema = {
        type: 'object',
        properties: {
          'prop_1': {type: 'string', path: 'prop1'},
          'prop_2': {type: 'number', path: 'deeply.nested.prop'},
        }
      };
      const norm = Object.create(Normalizer);
      assert.strictEqual(norm.denormalize(schema, record), null);
    })
  })
});
