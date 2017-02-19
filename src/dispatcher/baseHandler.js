import _omit from 'lodash/omit';
import _max from 'lodash/max';
import _isNumber from 'lodash/isNumber';

export const BaseHandlerPrototype = {

  handle: function(base, version, ...args) {
    return this.handleWith(base, version, args);
  },
  handleWith: function(base, version, args) {
    version = (_isNumber(version)) ? version : this.mostRecentVersion();
    return this.versions[version].handle.apply(base, args);
  },

  describe: function() {
    return {
      name: this.name,
      description: this.description,
      currentVersion: this.mostRecentVersion(),
      availableVersions: Object.keys(this.versions).map(parseFloat),
      versions: this.describeVersions
    }
  },

  describeVersions: function() {
    return Object.keys(this.versions).map(version => _omit(this.versions[version], ['handle']) );
  },

  toJSON: function() {
    return _omit(this, ['executeFn']);
  },

  mostRecentVersion: function() {
    return _max(Object.keys(this.versions).map(parseFloat));
  },

  mostRecentHandler: function() {
    const version = this.mostRecentVersion();
    return this.versions[version];
  },

  addVersion: function(spec={}) {
    const version = _isNumber(spec.version) ? spec.version : 0;

    if (typeof spec.handle !== 'function') {
      const err = new Error(`Handlers require a 'handle' function`);
      throw err;
    }

    if (this.versions[version]) {
      const err = new Error(`A handler already exists with name ${spec.name} and version ${version}`);
      throw err;
    }

    this.versions = Object.assign({}, this.versions, {[version]: spec});

    return this;
  },

  _initHandler: function(options) {
    this.name        = options.name;
    this.description = options.description;
    this.versions    = options.versions || {};
  }

}


export default function CreateHandler(options) {
  if (!options.name) {
    const err = new Error('Handlers require a `name` property');
    throw err;
  }

  const handler = Object.create(BaseHandlerPrototype);
  handler._initHandler(options);

  if (options.version || options.handle) {
    handler.addVersion(options);
  };

  return handler;
}
