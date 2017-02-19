// domain/schemaEventSpec.js


const eventSpecSchema = {
  type: 'object',
  properties: {
    name       : {type: 'string'},
    version    : {type: 'number'},
    description: {type: 'string'},
    schema     : {type: 'object'},
  },
  requiredProps: ['name', 'version', 'schema'],
}
