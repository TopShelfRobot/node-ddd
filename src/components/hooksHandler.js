import Promise from 'bluebird';

const HooksHandler = {
  beforeHook: function(position, fn) {
    const hookName = 'before' + capitalize(position);
    return this.addHook(hookName, fn);
  },
  afterHook: function(position, fn) {
    const hookName = 'after' + capitalize(position);
    return this.addHook(hookName, fn);
  },
  addHook: function(hookName, isSingle, fn) {
    if (arguments.length === 2) {
      fn = isSingle;
      isSingle = false;
    }

    if (isSingle) return this.addSingleHook(hookName, fn);

    this._ensureHookName(hookName);

    if (typeof this._hooks[hookName] === 'function') {
      throw new Error(`'${hookName}' is a singleton hook and can't be appended`)
    }

    this._hooks[hookName].push(fn);
    return this;
  },

  /**
   * Adds a function as a singleton hook, meaning only one function may be
   * registered to a hook.
   *
   * If hookName already contains functions registered via `addHook`, those
   * functions are de-registered.
   * Subsequent calls to addSingleHook will replace the callback function.
   * Subsequent calls to addHook will have no effect
   *
   * @param  {String}   hookName Name of hook
   * @param  {Function} fn       Callback function
   * @return {Object}            `this` object
   */
  addSingleHook: function(hookName, fn) {
    this._ensureHookName(hookName);
    this._hooks[hookName] = fn;
    return this;
  },

  runHooks: function(hookName, ...args) {
    const hooks = this._hooks[hookName] || [];

    return (typeof hooks === 'function')
      ? Promise.resolve(hooks.apply(this, args))
      : Promise.mapSeries(hooks, hook => hook.apply(this, args));
  },


  _ensureHookName: function(hookName) {
    this._hooks = this._hooks || {};
    this._hooks[hookName] = this._hooks[hookName] || [];
  }


}

export default function CreateHooksHandler() {
  const hooks = Object.create(HooksHandler);
  return hooks;
};

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
