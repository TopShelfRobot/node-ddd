import _isString from 'lodash/isString';
import _isObject from 'lodash/isObject';
import _isNil from 'lodash/isNil';
import dotty from 'dotty';

const Normalizer = {
  addSchema(schemaName, schema) {
    this._schemas = this._schema || {};
    this._schemas[schemaName] = schema;
  },

  getSchema(schema) {
    if (!schema) return null;
    if (_isObject(schema)) return schema;
    if (!_isString(schema)) {
      throw new Error(`Cannot get schema.  Please pass a string`);
    }

    return (this._schemas || {})[schema];
  },

  normalize(schemaName, o) {
    const schema = this.getSchema(schemaName);
    if (!o || !schema || !schema.properties) return o;

    const {properties, required=[]} = schema;
    const norm = Object.keys(properties).reduce((normalized, field) => {
      const normPath = properties[field].path || field;

      let value;
      if (normPath === '{date}') {
        value = new Date();
      } else {
        value = (Array.isArray(normPath))
          ? normPath.map(p => dotty.get(o, p)).find(val => !_isNil(val))
          : dotty.get(o, normPath);
      }

      if (required.indexOf(field) >= 0 && (value === undefined || value === null)) {
        const err = new Error(`Event is missing value for field ${field} at path ${normPath}`);
        throw(err);
      }

      dotty.put(normalized, field, value);
      return normalized;
    }, {});
    return norm;
  },


  denormalize(schemaName, record) {
    const schema = this.getSchema(schemaName);
    if (!record || !schema || !schema.properties) return record;

    const {properties, required=[]} = schema;
    const denorm = Object.keys(properties).reduce((denormalized, field) => {
      const denormPath = properties[field].path;
      const value = dotty.get(record, field);

      dotty.put(denormalized, denormPath, value);
      return denormalized;
    }, {});

    return denorm;
  }
}

export default Normalizer;
