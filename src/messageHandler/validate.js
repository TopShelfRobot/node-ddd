import tv4 from 'tv4';

function formatTV4ValidationError(err) {
  return `${err.message} - Path: '${err.dataPath}'`;
}


export default function validateAgainstSchema(data, schema) {
  schema = schema || {};
  const result = tv4.validateMultiple(data, schema);

  if (!result.valid) {
    const missing = result.missing.map(m => `Missing ${m}`);
    const errors = result.errors.map(err => formatTV4ValidationError(err))
    return errors.concat(missing);
  } else {
    return [];
  }
}
