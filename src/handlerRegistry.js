import _capitalize from 'lodash/capitalize';
import {ValidationError} from './errors';


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
function getDefaultVersion(strategy, versions, requested) {
  const versionNumbers = Object
    .keys(versions)
    .map(v => versions[v].version)
    .sort((a,b) => a-b);

  switch(strategy) {
    case 'strict':
      return null;
    case 'latest-version':
      return (versionNumbers.length) ? versions[versionNumbers[versionNumbers.length-1]] : null;
    case 'first-version':
      return versions[versionNumbers[0]];
    case 'previous':
      const previous = versionNumbers.filter(lessThan(requested));
      return (previous.length) ? versions[previous[previous.length-1]] : null;
    case 'next':
      const next = versionNumbers.filter(greaterThan(requested));
      return (next.length) ? versions[next[0]] : null;
    default:
      throw new Error(`Unknown default version strategy '${strategy}'`)
  }
}

const Registry = {

  registerHandlers(pathOrArray) {
    const handlers = loadFromPathOrArray(pathOrArray);

    handlers.forEach(handler => this.registerHandler(handler));
    return this;
  },

  registerHandler(handler) {
    const validationErrors = this.validateHandler(handler);
    if (validationErrors.length) {
      throw new ValidationError(`Validation error while registering ${this.text.name}`, validationErrors);
    }

    const handlerName = handler[this.nameProperty];
    const handlerVersion = handler[this.versionProperty];


    this.handlers[handlerName] = this.handlers[handlerName] || {};
    this.handlers[handlerName][handlerVersion] = handler;

    this.currentVersions[handlerName] = Math.max(this.currentVersions[handlerName] || 0, handlerVersion);

    return this;

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
    const versions = this.handlers[name];

    // TODO: What happens when version is missing?

    if (!versions) return null;

    const handler = versions[version];
    return handler || getDefaultVersion(this.defaultVersion, versions, version);
  },

  hasHandler: function(name, version) {
    const handlers = this.handlers[name];
    return (version)
      ? !!handlers[version]
      : !!handlers;
  },

  validateHandler(handler) {
    const validationErrors = []

    const requiredFields = [this.nameProperty, this.versionProperty];
    const missingFields = requiredFields.filter(req => !handler.hasOwnProperty(req) )
    missingFields.forEach(missing => validationErrors.push(`Missing required '${missing}' field from handler`));

    return validationErrors;
  },

  getVersion(name) {
    const currentVersion = this.currentVersions[name];
    if (!currentVersion) {
      throw new Error(`Cannot get current version of unknown handler '${name}'`);
    }
    return currentVersion;
  }
}









export default function createRegistry(options={}) {
  const name = (options.name || 'request').toLowerCase();
  const plural = name + 's';
  const prop = `_${plural}`;
  const capitalized = _capitalize(name);
  const capitalizedPlural = _capitalize(plural);
  const registryName = `${name}Registry`;

  const defaultVersion = (defaultVersionStrategies.indexOf(options.defaultVersion) !== -1)
    ? options.defaultVersion
    : 'previous'

  const inner = Object.create(Registry);
  Object.assign(inner, {
    text            : { name, prop, plural, capitalized, capitalizedPlural, },
    defaultVersion  : defaultVersion,
    versionProperty : options.versionProperty || 'version',
    nameProperty    : options.nameProperty || 'name',
    handlers        : {},
    currentVersions : {},
  });

  const registry = {
    [registryName]                  : inner,
    [`register${capitalizedPlural}`]: (...args) => inner.registerHandlers.apply(inner, args),
    [`register${capitalized}`]      : (...args) => inner.registerHandler.apply(inner, args),
    [`get${capitalized}Handlers`]   : (...args) => inner.getHandlers.apply(inner, args),
    [`get${capitalized}Handler`]    : (...args) => inner.getHandler.apply(inner, args),
    [`has${capitalized}Handler`]    : (...args) => inner.hasHandler.apply(inner, args),
    [`get${capitalized}Version`]    : (...args) => inner.getVersion.apply(inner, args),
  };

  return registry;
}
