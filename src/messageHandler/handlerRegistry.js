import _capitalize from 'lodash/capitalize';
import _difference from 'lodash/difference';
import _isObject from 'lodash/isObject';
import CreateHandlerFactory from './handler';
import {ValidationError} from './errors';
import validateAgainstSchema from './validate';


function loadFromPathOrArray(pa) {
  if (Array.isArray(pa)) {
    return pa;

  } else if (typeof pa === 'string') {
    try {
      const ary = require(pa);

      if (!Array.isArray(ary)) throw new Error(`Exported value from '${pa}' should be an array.`)
      return ary;

    } catch(err) {
      throw new Error(`Error loading array from '${pa}': ${err.message}`);
    }

  } else {
    throw new Error(`Please pass a string or Array`);
  }
}

const defaultVersionStrategies = [
  // If the requested version is not in the registry, return null
  'strict',
  // default to the highest version of the requested handler
  'latest-version',
  // default to the lowest version of the requested handler
  'first-version',
  // default to the highest version less than the requested version
  'previous',
  // default to the lowest version higher than the requested version
  'next'
]

function greaterThan(n) { return v => v>n}
function lessThan(n) { return v => v<n}
function getDefaultVersion(strategy, handlerVersions, requested) {
  const versionNumbers = Object
    .keys(handlerVersions)
    .map(v => handlerVersions[v].getVersion())
    .sort((a,b) => a-b);

  switch(strategy) {
    case 'strict':
      return null;
    case 'latest-version':
      return (versionNumbers.length) ? handlerVersions[versionNumbers[versionNumbers.length-1]] : null;
    case 'first-version':
      return handlerVersions[versionNumbers[0]];
    case 'previous':
      const previous = versionNumbers.filter(lessThan(requested));
      return (previous.length) ? handlerVersions[previous[previous.length-1]] : null;
    case 'next':
      const next = versionNumbers.filter(greaterThan(requested));
      return (next.length) ? handlerVersions[next[0]] : null;
    default:
      throw new Error(`Unknown default version strategy '${strategy}'`)
  }
}

const Registry = {

  loadHandler(config) {
    const handler = this.handlerFactory(config);
    return this.registerHandler(handler);
  },

  loadHandlers(pathOrConfig) {
    const configs = loadFromPathOrArray(pathOrConfig);
    return configs.map(config => this.loadHandler(config));
  },

  registerHandlers(handlers) {
    return handlers.map(handler => this.registerHandler(handler));
  },

  registerHandler(handler) {
    if (typeof handler.isValidHandler !== 'function' || !handler.isValidHandler()) {
      throw new Error(`Please pass a valid handler to register`);
    }
    const name    = handler.getName();
    const version = handler.getVersion();

    this.handlers[name] = this.handlers[name] || {};
    this.handlers[name][version] = handler;

    this.currentVersions[name] = Math.max(this.currentVersions[name] || 0, version);

    return handler;
  },

  /**
  * getPlural
  * Returns an array of registered handlers
  * @return {Array} Registered handlers
  */
  getHandlers: function(allHandlers=false) {
    // TODO: this is messed up

    return Object.keys(this.handlers).reduce((handlerList,name) => {
      const handlers = this.handlers[name];
      if (allHandlers) {
        return handlerList.concat(Object.keys(handlers).map(v => handlers[v]));
      } else {
        const versions = Object.keys(handlers);
        const mostRecent = versions[versions.length-1];
        return handlerList.concat(handlers[mostRecent]);
      }
    }, []);
  },

  /**
   * getHandler
   *
   * Retrieves the handler requested by name and version.
   * If the particular version of the handler does not exist, will
   * return the version according to the default version strategy
   *
   * @param  {[type]} {name    [description]
   * @param  {[type]} version} [description]
   * @return {[type]}          [description]
   */
  getHandler: function(searchObj) {
    const name = searchObj[this.nameProperty];
    const version = searchObj[this.versionProperty];
    const handlerVersions = this.handlers[name];

    // TODO: What happens when version is missing?

    if (!handlerVersions) return null;

    const handler = handlerVersions[version];
    return handler || getDefaultVersion(this.defaultVersion, handlerVersions, version);
  },

  hasHandler: function(name, version) {
    const handlers = this.handlers[name];
    return (version)
      ? !!handlers[version]
      : !!handlers;
  },



  getVersion(name) {
    const currentVersion = this.currentVersions[name];
    if (!currentVersion) {
      throw new Error(`Cannot get current version of unknown handler '${name}'`);
    }
    return currentVersion;
  },

  extractName(obj) {
    return obj[this.nameProperty];
  },

  extendSchema(schema) {
    this.schemas.push(schema);
  },

  getSchema(additionalSchemas) {
    additionalSchemas = additionalSchemas || [];
    additionalSchemas = (Array.isArray(additionalSchemas)) ? additionalSchemas : [additionalSchemas];

    return {
      type: 'object',
      allOf: this.schemas.concat(additionalSchemas),
    }
  },

  validateMessage(message, additionalSchemas) {
    const schema = this.getSchema(additionalSchemas);
    return validateAgainstSchema(message, schema);
  },


  createMessage(name, version, props) {
    if (_isObject(version)) {
      props = version;
      version = null;
    }

    props = props || {};

    // Is this a message known to the registry?
    if (!this.hasHandler(name)) {
      throw new ValidationError(`Error creating ${this.text.messageType}`, `${this.text.caitalized} '${name}' is unknown`);
    }

    const message = Object.assign({}, props, {
      [this.nameProperty]: name,
      [this.versionProperty]: version || this.getVersion(name),
    });

    const handler = this.getHandler(message);
    const validationErrors = this.validateMessage(message, handler.schema);

    if (validationErrors.length) {
      throw new ValidationError(`Malformed ${this.text.messageType} ('${name}')`, validationErrors);
    }

    return message;
  }
}









export default function createRegistry(options={}) {
  const messageType = (options.messageType || 'message').toLowerCase();
  const plural = messageType + 's';
  const prop = `_${plural}`;
  const capitalized = _capitalize(messageType);
  const capitalizedPlural = _capitalize(plural);
  const registryName = `${messageType}Registry`;

  const defaultVersion = (defaultVersionStrategies.indexOf(options.defaultVersion) !== -1)
    ? options.defaultVersion
    : 'previous'

  const handlerFactory = CreateHandlerFactory({
    messageType     : messageType,
    versionProperty : options.versionProperty,
    nameProperty    : options.nameProperty,
  });

  const inner = Object.create(Registry);
  Object.assign(inner, {
    text            : { messageType, prop, plural, capitalized, capitalizedPlural, },
    defaultVersion  : defaultVersion,
    versionProperty : options.versionProperty || 'version',
    nameProperty    : options.nameProperty || 'name',
    handlers        : {},
    currentVersions : {},
    schemas         : (options.schema) ? [options.schema] : [],
    handlerFactory  : handlerFactory,
  });

  const registry = {
    [registryName]                    : inner,
    [`create${capitalized}Handler`]   : (...args) => inner.handlerFactory.apply(inner, args),
    [`register${capitalized}Handlers`]: (...args) => inner.registerHandlers.apply(inner, args),
    [`register${capitalized}Handler`] : (...args) => inner.registerHandler.apply(inner, args),
    [`load${capitalized}Handlers`]    : (...args) => inner.loadHandlers.apply(inner, args),
    [`load${capitalized}Handler`]     : (...args) => inner.loadHandler.apply(inner, args),
    [`get${capitalized}Handlers`]     : (...args) => inner.getHandlers.apply(inner, args),
    [`get${capitalized}Handler`]      : (...args) => inner.getHandler.apply(inner, args),
    [`has${capitalized}Handler`]      : (...args) => inner.hasHandler.apply(inner, args),
    [`get${capitalized}Version`]      : (...args) => inner.getVersion.apply(inner, args),
    [`get${capitalized}Schema`]      : (...args) => inner.getSchema.apply(inner, args),
    [`extend${capitalized}Schema`]      : (...args) => inner.extendSchema.apply(inner, args),
    [`create${capitalized}`]      : (...args) => inner.createMessage.apply(inner, args),
    [`validate${capitalized}`]      : (...args) => inner.validateMessage.apply(inner, args),
  };

  return registry;
}
