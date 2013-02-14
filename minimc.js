(function () {
/**
 * almond 0.2.4 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("components/almond/almond", function(){});

'use strict';

define('js/utility/features',
[
], function() {

	var features = {};

	function feature_supported(featureName, test) {
		var ok = !!(test || (typeof test == 'function' && test()));

		$('html').
			toggleClass( featureName, ok ).
			toggleClass( 'no-' + featureName, !ok);

		features[featureName] = ok;
	}

	feature_supported('touch', 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch);
	// sort of a "duh" moment, but basically to yank the "no-js" class on <html>
	feature_supported('js', true);

	return features;
});

/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define('signals',[],function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

/** @license
 * crossroads <http://millermedeiros.github.com/crossroads.js/>
 * Author: Miller Medeiros | MIT License
 * v0.12.0 (2013/01/21 13:47)
 */

(function () {
var factory = function (signals) {

    var crossroads,
        _hasOptionalGroupBug,
        UNDEF;

    // Helpers -----------
    //====================

    // IE 7-8 capture optional groups as empty strings while other browsers
    // capture as `undefined`
    _hasOptionalGroupBug = (/t(.+)?/).exec('t')[1] === '';

    function arrayIndexOf(arr, val) {
        if (arr.indexOf) {
            return arr.indexOf(val);
        } else {
            //Array.indexOf doesn't work on IE 6-7
            var n = arr.length;
            while (n--) {
                if (arr[n] === val) {
                    return n;
                }
            }
            return -1;
        }
    }

    function arrayRemove(arr, item) {
        var i = arrayIndexOf(arr, item);
        if (i !== -1) {
            arr.splice(i, 1);
        }
    }

    function isKind(val, kind) {
        return '[object '+ kind +']' === Object.prototype.toString.call(val);
    }

    function isRegExp(val) {
        return isKind(val, 'RegExp');
    }

    function isArray(val) {
        return isKind(val, 'Array');
    }

    function isFunction(val) {
        return typeof val === 'function';
    }

    //borrowed from AMD-utils
    function typecastValue(val) {
        var r;
        if (val === null || val === 'null') {
            r = null;
        } else if (val === 'true') {
            r = true;
        } else if (val === 'false') {
            r = false;
        } else if (val === UNDEF || val === 'undefined') {
            r = UNDEF;
        } else if (val === '' || isNaN(val)) {
            //isNaN('') returns false
            r = val;
        } else {
            //parseFloat(null || '') returns NaN
            r = parseFloat(val);
        }
        return r;
    }

    function typecastArrayValues(values) {
        var n = values.length,
            result = [];
        while (n--) {
            result[n] = typecastValue(values[n]);
        }
        return result;
    }

    //borrowed from AMD-Utils
    function decodeQueryString(str, shouldTypecast) {
        var queryArr = (str || '').replace('?', '').split('&'),
            n = queryArr.length,
            obj = {},
            item, val;
        while (n--) {
            item = queryArr[n].split('=');
            val = shouldTypecast ? typecastValue(item[1]) : item[1];
            obj[item[0]] = (typeof val === 'string')? decodeURIComponent(val) : val;
        }
        return obj;
    }


    // Crossroads --------
    //====================

    /**
     * @constructor
     */
    function Crossroads() {
        this.bypassed = new signals.Signal();
        this.routed = new signals.Signal();
        this._routes = [];
        this._prevRoutes = [];
        this._piped = [];
        this.resetState();
    }

    Crossroads.prototype = {

        greedy : false,

        greedyEnabled : true,

        ignoreCase : true,

        ignoreState : false,

        shouldTypecast : false,

        normalizeFn : null,

        resetState : function(){
            this._prevRoutes.length = 0;
            this._prevMatchedRequest = null;
            this._prevBypassedRequest = null;
        },

        create : function () {
            return new Crossroads();
        },

        addRoute : function (pattern, callback, priority) {
            var route = new Route(pattern, callback, priority, this);
            this._sortedInsert(route);
            return route;
        },

        removeRoute : function (route) {
            arrayRemove(this._routes, route);
            route._destroy();
        },

        removeAllRoutes : function () {
            var n = this.getNumRoutes();
            while (n--) {
                this._routes[n]._destroy();
            }
            this._routes.length = 0;
        },

        parse : function (request, defaultArgs) {
            request = request || '';
            defaultArgs = defaultArgs || [];

            // should only care about different requests if ignoreState isn't true
            if ( !this.ignoreState &&
                (request === this._prevMatchedRequest ||
                 request === this._prevBypassedRequest) ) {
                return;
            }

            var routes = this._getMatchedRoutes(request),
                i = 0,
                n = routes.length,
                cur;

            if (n) {
                this._prevMatchedRequest = request;

                this._notifyPrevRoutes(routes, request);
                this._prevRoutes = routes;
                //should be incremental loop, execute routes in order
                while (i < n) {
                    cur = routes[i];
                    cur.route.matched.dispatch.apply(cur.route.matched, defaultArgs.concat(cur.params));
                    cur.isFirst = !i;
                    this.routed.dispatch.apply(this.routed, defaultArgs.concat([request, cur]));
                    i += 1;
                }
            } else {
                this._prevBypassedRequest = request;
                this.bypassed.dispatch.apply(this.bypassed, defaultArgs.concat([request]));
            }

            this._pipeParse(request, defaultArgs);
        },

        _notifyPrevRoutes : function(matchedRoutes, request) {
            var i = 0, prev;
            while (prev = this._prevRoutes[i++]) {
                //check if switched exist since route may be disposed
                if(prev.route.switched && this._didSwitch(prev.route, matchedRoutes)) {
                    prev.route.switched.dispatch(request);
                }
            }
        },

        _didSwitch : function (route, matchedRoutes){
            var matched,
                i = 0;
            while (matched = matchedRoutes[i++]) {
                // only dispatch switched if it is going to a different route
                if (matched.route === route) {
                    return false;
                }
            }
            return true;
        },

        _pipeParse : function(request, defaultArgs) {
            var i = 0, route;
            while (route = this._piped[i++]) {
                route.parse(request, defaultArgs);
            }
        },

        getNumRoutes : function () {
            return this._routes.length;
        },

        _sortedInsert : function (route) {
            //simplified insertion sort
            var routes = this._routes,
                n = routes.length;
            do { --n; } while (routes[n] && route._priority <= routes[n]._priority);
            routes.splice(n+1, 0, route);
        },

        _getMatchedRoutes : function (request) {
            var res = [],
                routes = this._routes,
                n = routes.length,
                route;
            //should be decrement loop since higher priorities are added at the end of array
            while (route = routes[--n]) {
                if ((!res.length || this.greedy || route.greedy) && route.match(request)) {
                    res.push({
                        route : route,
                        params : route._getParamsArray(request)
                    });
                }
                if (!this.greedyEnabled && res.length) {
                    break;
                }
            }
            return res;
        },

        pipe : function (otherRouter) {
            this._piped.push(otherRouter);
        },

        unpipe : function (otherRouter) {
            arrayRemove(this._piped, otherRouter);
        },

        toString : function () {
            return '[crossroads numRoutes:'+ this.getNumRoutes() +']';
        }
    };

    //"static" instance
    crossroads = new Crossroads();
    crossroads.VERSION = '0.12.0';

    crossroads.NORM_AS_ARRAY = function (req, vals) {
        return [vals.vals_];
    };

    crossroads.NORM_AS_OBJECT = function (req, vals) {
        return [vals];
    };


    // Route --------------
    //=====================

    /**
     * @constructor
     */
    function Route(pattern, callback, priority, router) {
        var isRegexPattern = isRegExp(pattern),
            patternLexer = router.patternLexer;
        this._router = router;
        this._pattern = pattern;
        this._paramsIds = isRegexPattern? null : patternLexer.getParamIds(pattern);
        this._optionalParamsIds = isRegexPattern? null : patternLexer.getOptionalParamsIds(pattern);
        this._matchRegexp = isRegexPattern? pattern : patternLexer.compilePattern(pattern, router.ignoreCase);
        this.matched = new signals.Signal();
        this.switched = new signals.Signal();
        if (callback) {
            this.matched.add(callback);
        }
        this._priority = priority || 0;
    }

    Route.prototype = {

        greedy : false,

        rules : void(0),

        match : function (request) {
            request = request || '';
            return this._matchRegexp.test(request) && this._validateParams(request); //validate params even if regexp because of `request_` rule.
        },

        _validateParams : function (request) {
            var rules = this.rules,
                values = this._getParamsObject(request),
                key;
            for (key in rules) {
                // normalize_ isn't a validation rule... (#39)
                if(key !== 'normalize_' && rules.hasOwnProperty(key) && ! this._isValidParam(request, key, values)){
                    return false;
                }
            }
            return true;
        },

        _isValidParam : function (request, prop, values) {
            var validationRule = this.rules[prop],
                val = values[prop],
                isValid = false,
                isQuery = (prop.indexOf('?') === 0);

            if (val == null && this._optionalParamsIds && arrayIndexOf(this._optionalParamsIds, prop) !== -1) {
                isValid = true;
            }
            else if (isRegExp(validationRule)) {
                if (isQuery) {
                    val = values[prop +'_']; //use raw string
                }
                isValid = validationRule.test(val);
            }
            else if (isArray(validationRule)) {
                if (isQuery) {
                    val = values[prop +'_']; //use raw string
                }
                isValid = this._isValidArrayRule(validationRule, val);
            }
            else if (isFunction(validationRule)) {
                isValid = validationRule(val, request, values);
            }

            return isValid; //fail silently if validationRule is from an unsupported type
        },

        _isValidArrayRule : function (arr, val) {
            if (! this._router.ignoreCase) {
                return arrayIndexOf(arr, val) !== -1;
            }

            if (typeof val === 'string') {
                val = val.toLowerCase();
            }

            var n = arr.length,
                item,
                compareVal;

            while (n--) {
                item = arr[n];
                compareVal = (typeof item === 'string')? item.toLowerCase() : item;
                if (compareVal === val) {
                    return true;
                }
            }
            return false;
        },

        _getParamsObject : function (request) {
            var shouldTypecast = this._router.shouldTypecast,
                values = this._router.patternLexer.getParamValues(request, this._matchRegexp, shouldTypecast),
                o = {},
                n = values.length,
                param, val;
            while (n--) {
                val = values[n];
                if (this._paramsIds) {
                    param = this._paramsIds[n];
                    if (param.indexOf('?') === 0 && val) {
                        //make a copy of the original string so array and
                        //RegExp validation can be applied properly
                        o[param +'_'] = val;
                        //update vals_ array as well since it will be used
                        //during dispatch
                        val = decodeQueryString(val, shouldTypecast);
                        values[n] = val;
                    }
                    // IE will capture optional groups as empty strings while other
                    // browsers will capture `undefined` so normalize behavior.
                    // see: #gh-58, #gh-59, #gh-60
                    if ( _hasOptionalGroupBug && val === '' && arrayIndexOf(this._optionalParamsIds, param) !== -1 ) {
                        val = void(0);
                        values[n] = val;
                    }
                    o[param] = val;
                }
                //alias to paths and for RegExp pattern
                o[n] = val;
            }
            o.request_ = shouldTypecast? typecastValue(request) : request;
            o.vals_ = values;
            return o;
        },

        _getParamsArray : function (request) {
            var norm = this.rules? this.rules.normalize_ : null,
                params;
            norm = norm || this._router.normalizeFn; // default normalize
            if (norm && isFunction(norm)) {
                params = norm(request, this._getParamsObject(request));
            } else {
                params = this._getParamsObject(request).vals_;
            }
            return params;
        },

        interpolate : function(replacements) {
            var str = this._router.patternLexer.interpolate(this._pattern, replacements);
            if (! this._validateParams(str) ) {
                throw new Error('Generated string doesn\'t validate against `Route.rules`.');
            }
            return str;
        },

        dispose : function () {
            this._router.removeRoute(this);
        },

        _destroy : function () {
            this.matched.dispose();
            this.switched.dispose();
            this.matched = this.switched = this._pattern = this._matchRegexp = null;
        },

        toString : function () {
            return '[Route pattern:"'+ this._pattern +'", numListeners:'+ this.matched.getNumListeners() +']';
        }

    };



    // Pattern Lexer ------
    //=====================

    Crossroads.prototype.patternLexer = (function () {

        var
            //match chars that should be escaped on string regexp
            ESCAPE_CHARS_REGEXP = /[\\.+*?\^$\[\](){}\/'#]/g,

            //trailing slashes (begin/end of string)
            LOOSE_SLASHES_REGEXP = /^\/|\/$/g,
            LEGACY_SLASHES_REGEXP = /\/$/g,

            //params - everything between `{ }` or `: :`
            PARAMS_REGEXP = /(?:\{|:)([^}:]+)(?:\}|:)/g,

            //used to save params during compile (avoid escaping things that
            //shouldn't be escaped).
            TOKENS = {
                'OS' : {
                    //optional slashes
                    //slash between `::` or `}:` or `\w:` or `:{?` or `}{?` or `\w{?`
                    rgx : /([:}]|\w(?=\/))\/?(:|(?:\{\?))/g,
                    save : '$1{{id}}$2',
                    res : '\\/?'
                },
                'RS' : {
                    //required slashes
                    //used to insert slash between `:{` and `}{`
                    rgx : /([:}])\/?(\{)/g,
                    save : '$1{{id}}$2',
                    res : '\\/'
                },
                'RQ' : {
                    //required query string - everything in between `{? }`
                    rgx : /\{\?([^}]+)\}/g,
                    //everything from `?` till `#` or end of string
                    res : '\\?([^#]+)'
                },
                'OQ' : {
                    //optional query string - everything in between `:? :`
                    rgx : /:\?([^:]+):/g,
                    //everything from `?` till `#` or end of string
                    res : '(?:\\?([^#]*))?'
                },
                'OR' : {
                    //optional rest - everything in between `: *:`
                    rgx : /:([^:]+)\*:/g,
                    res : '(.*)?' // optional group to avoid passing empty string as captured
                },
                'RR' : {
                    //rest param - everything in between `{ *}`
                    rgx : /\{([^}]+)\*\}/g,
                    res : '(.+)'
                },
                // required/optional params should come after rest segments
                'RP' : {
                    //required params - everything between `{ }`
                    rgx : /\{([^}]+)\}/g,
                    res : '([^\\/?]+)'
                },
                'OP' : {
                    //optional params - everything between `: :`
                    rgx : /:([^:]+):/g,
                    res : '([^\\/?]+)?\/?'
                }
            },

            LOOSE_SLASH = 1,
            STRICT_SLASH = 2,
            LEGACY_SLASH = 3,

            _slashMode = LOOSE_SLASH;


        function precompileTokens(){
            var key, cur;
            for (key in TOKENS) {
                if (TOKENS.hasOwnProperty(key)) {
                    cur = TOKENS[key];
                    cur.id = '__CR_'+ key +'__';
                    cur.save = ('save' in cur)? cur.save.replace('{{id}}', cur.id) : cur.id;
                    cur.rRestore = new RegExp(cur.id, 'g');
                }
            }
        }
        precompileTokens();


        function captureVals(regex, pattern) {
            var vals = [], match;
            // very important to reset lastIndex since RegExp can have "g" flag
            // and multiple runs might affect the result, specially if matching
            // same string multiple times on IE 7-8
            regex.lastIndex = 0;
            while (match = regex.exec(pattern)) {
                vals.push(match[1]);
            }
            return vals;
        }

        function getParamIds(pattern) {
            return captureVals(PARAMS_REGEXP, pattern);
        }

        function getOptionalParamsIds(pattern) {
            return captureVals(TOKENS.OP.rgx, pattern);
        }

        function compilePattern(pattern, ignoreCase) {
            pattern = pattern || '';

            if(pattern){
                if (_slashMode === LOOSE_SLASH) {
                    pattern = pattern.replace(LOOSE_SLASHES_REGEXP, '');
                }
                else if (_slashMode === LEGACY_SLASH) {
                    pattern = pattern.replace(LEGACY_SLASHES_REGEXP, '');
                }

                //save tokens
                pattern = replaceTokens(pattern, 'rgx', 'save');
                //regexp escape
                pattern = pattern.replace(ESCAPE_CHARS_REGEXP, '\\$&');
                //restore tokens
                pattern = replaceTokens(pattern, 'rRestore', 'res');

                if (_slashMode === LOOSE_SLASH) {
                    pattern = '\\/?'+ pattern;
                }
            }

            if (_slashMode !== STRICT_SLASH) {
                //single slash is treated as empty and end slash is optional
                pattern += '\\/?';
            }
            return new RegExp('^'+ pattern + '$', ignoreCase? 'i' : '');
        }

        function replaceTokens(pattern, regexpName, replaceName) {
            var cur, key;
            for (key in TOKENS) {
                if (TOKENS.hasOwnProperty(key)) {
                    cur = TOKENS[key];
                    pattern = pattern.replace(cur[regexpName], cur[replaceName]);
                }
            }
            return pattern;
        }

        function getParamValues(request, regexp, shouldTypecast) {
            var vals = regexp.exec(request);
            if (vals) {
                vals.shift();
                if (shouldTypecast) {
                    vals = typecastArrayValues(vals);
                }
            }
            return vals;
        }

        function interpolate(pattern, replacements) {
            if (typeof pattern !== 'string') {
                throw new Error('Route pattern should be a string.');
            }

            var replaceFn = function(match, prop){
                    var val;
                    prop = (prop.substr(0, 1) === '?')? prop.substr(1) : prop;
                    if (replacements[prop] != null) {
                        if (typeof replacements[prop] === 'object') {
                            var queryParts = [];
                            for(var key in replacements[prop]) {
                                queryParts.push(encodeURI(key + '=' + replacements[prop][key]));
                            }
                            val = '?' + queryParts.join('&');
                        } else {
                            // make sure value is a string see #gh-54
                            val = String(replacements[prop]);
                        }

                        if (match.indexOf('*') === -1 && val.indexOf('/') !== -1) {
                            throw new Error('Invalid value "'+ val +'" for segment "'+ match +'".');
                        }
                    }
                    else if (match.indexOf('{') !== -1) {
                        throw new Error('The segment '+ match +' is required.');
                    }
                    else {
                        val = '';
                    }
                    return val;
                };

            if (! TOKENS.OS.trail) {
                TOKENS.OS.trail = new RegExp('(?:'+ TOKENS.OS.id +')+$');
            }

            return pattern
                        .replace(TOKENS.OS.rgx, TOKENS.OS.save)
                        .replace(PARAMS_REGEXP, replaceFn)
                        .replace(TOKENS.OS.trail, '') // remove trailing
                        .replace(TOKENS.OS.rRestore, '/'); // add slash between segments
        }

        //API
        return {
            strict : function(){
                _slashMode = STRICT_SLASH;
            },
            loose : function(){
                _slashMode = LOOSE_SLASH;
            },
            legacy : function(){
                _slashMode = LEGACY_SLASH;
            },
            getParamIds : getParamIds,
            getOptionalParamsIds : getOptionalParamsIds,
            getParamValues : getParamValues,
            compilePattern : compilePattern,
            interpolate : interpolate
        };

    }());


    return crossroads;
};

if (typeof define === 'function' && define.amd) {
    define('crossroads',['signals'], factory);
} else if (typeof module !== 'undefined' && module.exports) { //Node
    module.exports = factory(require('signals'));
} else {
    /*jshint sub:true */
    window['crossroads'] = factory(window['signals']);
}

}());


//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

define("underscore", (function (global) {
    return function () {
        var ret, fn;
        return ret || global._;
    };
}(this)));

'use strict';

define('js/routes',
[
	'crossroads',
	'underscore',
],
function(crossroads, _) {

	function go_to(hash) {
		return function() {
			window.location.hash = hash;
		}
	}

	/**
	 * Helper function for mapping trigger arguments to a hash via an array of key names
	 */
	function parameter_map_array(memo, paramName, index) {
		memo[paramName] = this[index];
		return memo;
	}

	/**
	 * Helper function for mapping trigger arguments to a hash via getter functions
	 */
	function parameter_map_object(memo, getter, paramName) {
		memo[paramName] = getter(this);
		return memo;
	}

	function trigger_event(eventName, parameterMap) {
		return function() {
			var args = arguments;
			if (parameterMap) {
				args = _.reduce(
					parameterMap,
					_.isArray(parameterMap) ? parameter_map_array : parameter_map_object,
					{},
					args
				);
			}
			$(document).trigger(eventName, args);
		}
	}

	crossroads.addRoute('/', go_to('/movies') );
	crossroads.addRoute('/movies', trigger_event('viewMovies') );
	crossroads.addRoute('/movies/{title_slug}',
						trigger_event('viewMovieDetails', ['title_slug'])
					   );
	crossroads.addRoute('/tv-shows', trigger_event('viewTVShows') );
	crossroads.addRoute('/tv-shows/{title_slug}',
						trigger_event('viewEpisodes', ['title_slug'])
					   );
	crossroads.addRoute(/tv-shows\/([^/]+)\/S(\d{2})E(\d{2})\/([^/]+)/,
						trigger_event('viewEpisodeDetails', {
							"title_slug" : function(args) { return args[0]; },
							"season"     : function(args) { return parseInt(args[1], 10); },
							"episode"    : function(args) { return parseInt(args[2], 10); },
							"episode_slug" : function(args) { return args[3]; },
						})
					   );
	crossroads.addRoute(/tv-shows\/([^/]+)\/S(\d{2})/,
						trigger_event('viewEpisodes', {
							"title_slug" : function(args) { return args[0]; },
							"season"     : function(args) { return parseInt(args[1], 10); },
						})
					   );

	// TODO - Find a better router
	$(window).on('hashchange', function(event) {
		crossroads.parse(window.location.hash.substr(1));
	});
});

// ==========================================
// Copyright 2013 Twitter, Inc
// Licensed under The MIT License
// http://opensource.org/licenses/MIT
// ==========================================

"use strict";

define('components/flight/lib/utils',

  [],

  function () {

    var arry = [];
    var DEFAULT_INTERVAL = 100;

    var utils = {

      isDomObj: function(obj) {
        return !!(obj.nodeType || (obj === window));
      },

      toArray: function(obj, from) {
        return arry.slice.call(obj, from);
      },

      // returns new object representing multiple objects merged together
      // optional final argument is boolean which specifies if merge is recursive
      // original objects are unmodified
      //
      // usage:
      //   var base = {a:2, b:6};
      //   var extra = {b:3, c:4};
      //   merge(base, extra); //{a:2, b:3, c:4}
      //   base; //{a:2, b:6}
      //
      //   var base = {a:2, b:6};
      //   var extra = {b:3, c:4};
      //   var extraExtra = {a:4, d:9};
      //   merge(base, extra, extraExtra); //{a:4, b:3, c:4. d: 9}
      //   base; //{a:2, b:6}
      //
      //   var base = {a:2, b:{bb:4, cc:5}};
      //   var extra = {a:4, b:{cc:7, dd:1}};
      //   merge(base, extra, true); //{a:4, b:{bb:4, cc:7, dd:1}}
      //   base; //{a:2, b:6}

      merge: function(/*obj1, obj2,....deepCopy*/) {
        var args = this.toArray(arguments);

        //start with empty object so a copy is created
        args.unshift({});

        if (args[args.length - 1] === true) {
          //jquery extend requires deep copy as first arg
          args.pop();
          args.unshift(true);
        }

        return $.extend.apply(undefined, args);
      },

      // updates base in place by copying properties of extra to it
      // optionally clobber protected
      // usage:
      //   var base = {a:2, b:6};
      //   var extra = {c:4};
      //   push(base, extra); //{a:2, b:6, c:4}
      //   base; //{a:2, b:6, c:4}
      //
      //   var base = {a:2, b:6};
      //   var extra = {b: 4 c:4};
      //   push(base, extra, true); //Error ("utils.push attempted to overwrite 'b' while running in protected mode")
      //   base; //{a:2, b:6}
      //
      // objects with the same key will merge recursively when protect is false
      // eg:
      // var base = {a:16, b:{bb:4, cc:10}};
      // var extra = {b:{cc:25, dd:19}, c:5};
      // push(base, extra); //{a:16, {bb:4, cc:25, dd:19}, c:5}
      //
      push: function(base, extra, protect) {
        if (base) {
          Object.keys(extra || {}).forEach(function(key) {
            if (base[key] && protect) {
              throw Error("utils.push attempted to overwrite '" + key + "' while running in protected mode");
            }

            if (typeof base[key] == "object" && typeof extra[key] == "object") {
              //recurse
              this.push(base[key], extra[key]);
            } else {
              //no protect, so extra wins
              base[key] = extra[key];
            }
          }, this);
        }

        return base;
      },

      isEnumerable: function(obj, property) {
        return Object.keys(obj).indexOf(property) > -1;
      },

      //build a function from other function(s)
      //util.compose(a,b,c) -> a(b(c()));
      //implementation lifted from underscore.js (c) 2009-2012 Jeremy Ashkenas
      compose: function() {
        var funcs = arguments;

        return function() {
          var args = arguments;

          for (var i = funcs.length-1; i >= 0; i--) {
            args = [funcs[i].apply(this, args)];
          }

          return args[0];
        };
      },

      // Can only unique arrays of homogeneous primitives, e.g. an array of only strings, an array of only booleans, or an array of only numerics
      uniqueArray: function(array) {
        var u = {}, a = [];

        for (var i = 0, l = array.length; i < l; ++i) {
          if (u.hasOwnProperty(array[i])) {
            continue;
          }

          a.push(array[i]);
          u[array[i]] = 1;
        }

        return a;
      },

      debounce: function(func, wait, immediate) {
        if (typeof wait != 'number') {
          wait = DEFAULT_INTERVAL;
        }

        var timeout, result;

        return function() {
          var context = this, args = arguments;
          var later = function() {
            timeout = null;
            if (!immediate) {
              result = func.apply(context, args);
            }
          };
          var callNow = immediate && !timeout;

          clearTimeout(timeout);
          timeout = setTimeout(later, wait);

          if (callNow) {
            result = func.apply(context, args);
          }

          return result;
        };
      },

      throttle: function(func, wait) {
        if (typeof wait != 'number') {
          wait = DEFAULT_INTERVAL;
        }

        var context, args, timeout, throttling, more, result;
        var whenDone = this.debounce(function(){
          more = throttling = false;
        }, wait);

        return function() {
          context = this; args = arguments;
          var later = function() {
            timeout = null;
            if (more) {
              result = func.apply(context, args);
            }
            whenDone();
          };

          if (!timeout) {
            timeout = setTimeout(later, wait);
          }

          if (throttling) {
            more = true;
          } else {
            throttling = true;
            result = func.apply(context, args);
          }

          whenDone();
          return result;
        };
      },

      countThen: function(num, base) {
        return function() {
          if (!--num) { return base.apply(this, arguments); }
        };
      },

      delegate: function(rules) {
        return function(e, data) {
          var target = $(e.target), parent;

          Object.keys(rules).forEach(function(selector) {
            if ((parent = target.closest(selector)).length) {
              data = data || {};
              data.el = parent[0];
              return rules[selector].apply(this, [e, data]);
            }
          }, this);
        };
      }

    };

    return utils;
  }
);

// ==========================================
// Copyright 2013 Twitter, Inc
// Licensed under The MIT License
// http://opensource.org/licenses/MIT
// ==========================================

"use strict";

define('components/flight/lib/registry',

  [
    './utils'
  ],

  function (util) {

    function parseEventArgs(instance, args) {
      var element, type, callback;

      args = util.toArray(args);

      if (typeof args[args.length-1] === 'function') {
        callback = args.pop();
      }

      if (typeof args[args.length-1] === 'object') {
        args.pop();
      }

      if (args.length == 2) {
        element = args[0];
        type = args[1];
      } else {
        element = instance.node;
        type = args[0];
      }

      return {
        element: element,
        type: type,
        callback: callback
      };
    }

    function matchEvent(a, b) {
      return (
        (a.element == b.element) &&
        (a.type == b.type) &&
        (b.callback == null || (a.callback == b.callback))
      );
    }

    function Registry() {

      var registry = this;

      (this.reset = function() {
        this.components = [];
        this.allInstances = [];
        this.events = [];
      }).call(this);

      function ComponentInfo(component) {
        this.component = component;
        this.instances = [];

        this.addInstance = function(instance) {
          this.throwIfInstanceExistsOnNode(instance);

          var instanceInfo = new InstanceInfo(instance);
          this.instances.push(instanceInfo);

          return instanceInfo;
        }

        this.throwIfInstanceExistsOnNode = function(instance) {
          this.instances.forEach(function (instanceInfo) {
            if (instanceInfo.instance.$node[0] === instance.$node[0]) {
              throw new Error('Instance of ' + instance.constructor + ' already exists on node ' + instance.$node[0]);
            }
          });
        }

        this.removeInstance = function(instance) {
          var instanceInfo = this.instances.filter(function(instanceInfo) {
            return instanceInfo.instance == instance;
          })[0];

          var index = this.instances.indexOf(instanceInfo);

          (index > -1)  && this.instances.splice(index, 1);

          if (!this.instances.length) {
            //if I hold no more instances remove me from registry
            registry.removeComponentInfo(this);
          }
        }
      }

      function InstanceInfo(instance) {
        this.instance = instance;
        this.events = [];

        this.addTrigger = function() {};

        this.addBind = function(event) {
          this.events.push(event);
          registry.events.push(event);
        };

        this.removeBind = function(event) {
          for (var i = 0, e; e = this.events[i]; i++) {
            if (matchEvent(e, event)) {
              this.events.splice(i, 1);
            }
          }
        }
      }

      this.addInstance = function(instance) {
        var component = this.findComponentInfo(instance);

        if (!component) {
          component = new ComponentInfo(instance.constructor);
          this.components.push(component);
        }

        var inst = component.addInstance(instance);

        this.allInstances.push(inst);

        return component;
      };

      this.removeInstance = function(instance) {
        var index, instInfo = this.findInstanceInfo(instance);

        //remove from component info
        var componentInfo = this.findComponentInfo(instance);
        componentInfo.removeInstance(instance);

        //remove from registry
        var index = this.allInstances.indexOf(instInfo);
        (index > -1)  && this.allInstances.splice(index, 1);
      };

      this.removeComponentInfo = function(componentInfo) {
        var index = this.components.indexOf(componentInfo);
        (index > -1)  && this.components.splice(index, 1);
      };

      this.findComponentInfo = function(which) {
        var component = which.attachTo ? which : which.constructor;

        for (var i = 0, c; c = this.components[i]; i++) {
          if (c.component === component) {
            return c;
          }
        }

        return null;
      };

      this.findInstanceInfo = function(which) {
        var testFn;

        if (which.node) {
          //by instance (returns matched instance)
          testFn = function(inst) {return inst.instance === which};
        } else {
          //by node (returns array of matches)
          testFn = function(inst) {return inst.instance.node === which};
        }

        var matches = this.allInstances.filter(testFn);
        if (!matches.length) {
          return which.node ? null : [];
        }
        return which.node ? matches[0] : matches;
      };

      this.trigger = function() {
        var event = parseEventArgs(this, arguments),
            instance = registry.findInstanceInfo(this);

        if (instance) {
          instance.addTrigger(event);
        }
      };

      this.on = function(componentOn) {
        var otherArgs = util.toArray(arguments, 1);
        var instance = registry.findInstanceInfo(this);
        var boundCallback;

        if (instance) {
          boundCallback = componentOn.apply(null, otherArgs);
          if(boundCallback) {
            otherArgs[otherArgs.length-1] = boundCallback;
          }
          var event = parseEventArgs(this, otherArgs);
          instance.addBind(event);
        }
      };

      this.off = function(el, type, callback) {
        var event = parseEventArgs(this, arguments),
            instance = registry.findInstanceInfo(this);

        if (instance) {
          instance.removeBind(event);
        }
      };

      this.teardown = function() {
        registry.removeInstance(this);
      };

      this.withRegistration = function() {
        this.before('initialize', function() {
          registry.addInstance(this);
        });

        this.after('trigger', registry.trigger);
        this.around('on', registry.on);
        this.after('off', registry.off);
        this.after('teardown', {obj:registry, fnName:'teardown'});
      };

    }

    return new Registry;
  }
);

"use strict";

define('components/flight/tools/debug/debug',

  [
    '../../lib/registry',
    '../../lib/utils'
  ],

  function(registry, utils) {

    var logFilter;

    //******************************************************************************************
    // Search object model
    //******************************************************************************************

    function traverse(util, searchTerm, options) {
      var options = options || {};
      var obj = options.obj || window;
      var path = options.path || ((obj==window) ? "window" : "");
      var props = Object.keys(obj);
      props.forEach(function(prop) {
        if ((tests[util] || util)(searchTerm, obj, prop)){
          console.log([path, ".", prop].join(""), "->",["(", typeof obj[prop], ")"].join(""), obj[prop]);
        }
        if(Object.prototype.toString.call(obj[prop])=="[object Object]" && (obj[prop] != obj) && path.split(".").indexOf(prop) == -1) {
          traverse(util, searchTerm, {obj: obj[prop], path: [path,prop].join(".")});
        }
      });
    }

    function search(util, expected, searchTerm, options) {
      if (!expected || typeof searchTerm == expected) {
        traverse(util, searchTerm, options);
      } else {
        console.error([searchTerm, 'must be', expected].join(' '))
      }
    }

    var tests = {
      'name': function(searchTerm, obj, prop) {return searchTerm == prop},
      'nameContains': function(searchTerm, obj, prop) {return prop.indexOf(searchTerm)>-1},
      'type': function(searchTerm, obj, prop) {return obj[prop] instanceof searchTerm},
      'value': function(searchTerm, obj, prop) {return obj[prop] === searchTerm},
      'valueCoerced': function(searchTerm, obj, prop) {return obj[prop] == searchTerm}
    }

    function byName(searchTerm, options) {search('name', 'string', searchTerm, options);};
    function byNameContains(searchTerm, options) {search('nameContains', 'string', searchTerm, options);};
    function byType(searchTerm, options) {search('type', 'function', searchTerm, options);};
    function byValue(searchTerm, options) {search('value', null, searchTerm, options);};
    function byValueCoerced(searchTerm, options) {search('valueCoerced', null, searchTerm, options);};
    function custom(fn, options) {traverse(fn, null, options);};

    //******************************************************************************************
    // Event logging
    //******************************************************************************************
    var logLevel = 'all';
    logFilter = {actions: logLevel, eventNames: logLevel}; //no filter by default

    function filterEventLogsByAction(/*actions*/) {
      var actions = [].slice.call(arguments, 0);

      logFilter.eventNames.length || (logFilter.eventNames = 'all');
      logFilter.actions = actions.length ? actions : 'all';
    }

    function filterEventLogsByName(/*eventNames*/) {
      var eventNames = [].slice.call(arguments, 0);

      logFilter.actions.length || (logFilter.actions = 'all');
      logFilter.eventNames = eventNames.length ? eventNames : 'all';
    }

    function hideAllEventLogs() {
      logFilter.actions = [];
      logFilter.eventNames = [];
    }

    function showAllEventLogs() {
      logFilter.actions = 'all';
      logFilter.eventNames = 'all';
    }

    return {

      enable: function(enable) {
        this.enabled = !!enable;

        if (enable && window.console) {
          console.info('Booting in DEBUG mode');
          console.info('You can filter event logging with DEBUG.events.logAll/logNone/logByName/logByAction');
        }

        window.DEBUG = this;
      },

      find: {
        byName: byName,
        byNameContains: byNameContains,
        byType: byType,
        byValue: byValue,
        byValueCoerced: byValueCoerced,
        custom: custom
      },

      events: {
        logFilter: logFilter,

        // Accepts any number of action args
        // e.g. DEBUG.events.logByAction("on", "off")
        logByAction: filterEventLogsByAction,

        // Accepts any number of event name args (inc. regex or wildcards)
        // e.g. DEBUG.events.logByName(/ui.*/, "*Thread*");
        logByName: filterEventLogsByName,

        logAll: showAllEventLogs,
        logNone: hideAllEventLogs
      }
    };
  }
);


// ==========================================
// Copyright 2013 Twitter, Inc
// Licensed under The MIT License
// http://opensource.org/licenses/MIT
// ==========================================

"use strict";

define('components/flight/lib/compose',

  [
    './utils',
    '../tools/debug/debug'
  ],

  function(util, debug) {

    //enumerables are shims - getOwnPropertyDescriptor shim doesn't work
    var canWriteProtect = debug.enabled && !util.isEnumerable(Object, 'getOwnPropertyDescriptor');
    //whitelist of unlockable property names
    var dontLock = ['mixedIn'];

    if (canWriteProtect) {
      //IE8 getOwnPropertyDescriptor is built-in but throws exeption on non DOM objects
      try {
        Object.getOwnPropertyDescriptor(Object, 'keys');
      } catch(e) {
        canWriteProtect = false;
      }
    }

    function setPropertyWritability(obj, isWritable) {
      if (!canWriteProtect) {
        return;
      }

      var props = Object.create(null);

      Object.keys(obj).forEach(
        function (key) {
          if (dontLock.indexOf(key) < 0) {
            var desc = Object.getOwnPropertyDescriptor(obj, key);
            desc.writable = isWritable;
            props[key] = desc;
          }
        }
      );

      Object.defineProperties(obj, props);
    }

    function unlockProperty(obj, prop, op) {
      var writable;

      if (!canWriteProtect || !obj.hasOwnProperty(prop)) {
        op.call(obj);
        return;
      }

      writable = Object.getOwnPropertyDescriptor(obj, prop).writable;
      Object.defineProperty(obj, prop, { writable: true });
      op.call(obj);
      Object.defineProperty(obj, prop, { writable: writable });
    }

    function mixin(base, mixins) {
      base.mixedIn = base.hasOwnProperty('mixedIn') ? base.mixedIn : [];

      mixins.forEach(function(mixin) {
        if (base.mixedIn.indexOf(mixin) == -1) {
          setPropertyWritability(base, false);
          mixin.call(base);
          base.mixedIn.push(mixin);
        }
      });

      setPropertyWritability(base, true);
    }

    return {
      mixin: mixin,
      unlockProperty: unlockProperty
    };

  }
);

// ==========================================
// Copyright 2013 Twitter, Inc
// Licensed under The MIT License
// http://opensource.org/licenses/MIT
// ==========================================

"use strict";

define('components/flight/lib/advice',

  [
    './utils',
    './compose'
  ],

  function (util, compose) {

    var advice = {

      around: function(base, wrapped) {
        return function() {
          var args = util.toArray(arguments);
          return wrapped.apply(this, [base.bind(this)].concat(args));
        }
      },

      before: function(base, before) {
        return this.around(base, function() {
          var args = util.toArray(arguments),
              orig = args.shift(),
              beforeFn;

          beforeFn = (typeof before == 'function') ? before : before.obj[before.fnName];
          beforeFn.apply(this, args);
          return (orig).apply(this, args);
        });
      },

      after: function(base, after) {
        return this.around(base, function() {
          var args = util.toArray(arguments),
              orig = args.shift(),
              afterFn;

          // this is a separate statement for debugging purposes.
          var res = (orig.unbound || orig).apply(this, args);

          afterFn = (typeof after == 'function') ? after : after.obj[after.fnName];
          afterFn.apply(this, args);
          return res;
        });
      },

      // a mixin that allows other mixins to augment existing functions by adding additional
      // code before, after or around.
      withAdvice: function() {
        ['before', 'after', 'around'].forEach(function(m) {
          this[m] = function(method, fn) {

            compose.unlockProperty(this, method, function() {
              if (typeof this[method] == 'function') {
                return this[method] = advice[m](this[method], fn);
              } else {
                return this[method] = fn;
              }
            });

          };
        }, this);
      }
    };

    return advice;
  }
);

// ==========================================
// Copyright 2013 Twitter, Inc
// Licensed under The MIT License
// http://opensource.org/licenses/MIT
// ==========================================

"use strict";

define('components/flight/lib/component',

  [
    './advice',
    './utils',
    './compose',
    './registry'
  ],

  function(advice, utils, compose, registry) {

    function teardownInstance(instanceInfo){
      instanceInfo.events.slice().forEach(function(event) {
        var args = [event.type];

        event.element && args.unshift(event.element);
        (typeof event.callback == 'function') && args.push(event.callback);

        this.off.apply(this, args);
      }, instanceInfo.instance);
    }


    function teardown() {
      this.trigger("componentTearDown");
      teardownInstance(registry.findInstanceInfo(this));
    }

    //teardown for all instances of this constructor
    function teardownAll() {
      var componentInfo = registry.findComponentInfo(this);

      componentInfo && componentInfo.instances.slice().forEach(function(info) {
        info.instance.teardown();
      });
    }

    //common mixin allocates basic functionality - used by all component prototypes
    //callback context is bound to component
    function withBaseComponent() {

      // delegate trigger, bind and unbind to an element
      // if $element not supplied, use component's node
      // other arguments are passed on
      this.trigger = function() {
        var $element, type, data;
        var args = utils.toArray(arguments);

        if (typeof args[args.length - 1] != "string") {
          data = args.pop();
        }

        $element = (args.length == 2) ? $(args.shift()) : this.$node;
        type = args[0];

        if (window.DEBUG && window.postMessage) {
          try {
            window.postMessage(data, '*');
          } catch(e) {
            console.log('unserializable data for event',type,':',data);
            throw new Error(
              ["The event", event.type, "on component", this.describe, "was triggered with non-serializable data"].join(" ")
            );
          }
        }

        if (typeof this.attr.eventData === 'object') {
          data = $.extend(true, {}, this.attr.eventData, data);
        }

        return $element.trigger(type, data);
      };

      this.on = function() {
        var $element, type, callback, originalCb;
        var args = utils.toArray(arguments);

        if (typeof args[args.length - 1] == "object") {
          //delegate callback
          originalCb = utils.delegate(
            this.resolveDelegateRules(args.pop())
          );
        } else {
          originalCb = args.pop();
        }

        callback = originalCb && originalCb.bind(this);
        callback.target = originalCb;

        // if the original callback is already branded by jQuery's guid, copy it to the context-bound version
        if (originalCb.guid) {
          callback.guid = originalCb.guid;
        }

        $element = (args.length == 2) ? $(args.shift()) : this.$node;
        type = args[0];

        if (typeof callback == 'undefined') {
          throw new Error("Unable to bind to '" + type + "' because the given callback is undefined");
        }

        $element.on(type, callback);

        // get jquery's guid from our bound fn, so unbinding will work
        originalCb.guid = callback.guid;

        return callback;
      };

      this.off = function() {
        var $element, type, callback;
        var args = utils.toArray(arguments);

        if (typeof args[args.length - 1] == "function") {
          callback = args.pop();
        }

        $element = (args.length == 2) ? $(args.shift()) : this.$node;
        type = args[0];

        return $element.off(type, callback);
      };

      this.resolveDelegateRules = function(ruleInfo) {
        var rules = {};

        Object.keys(ruleInfo).forEach(
          function(r) {
            if (!this.attr.hasOwnProperty(r)) {
              throw new Error('Component "' + this.describe + '" wants to listen on "' + r + '" but no such attribute was defined.');
            }
            rules[this.attr[r]] = ruleInfo[r];
          },
          this
        );

        return rules;
      };

      this.defaultAttrs = function(defaults) {
        utils.push(this.defaults, defaults, true) || (this.defaults = defaults);
      };

      this.select = function(attributeKey) {
        return this.$node.find(this.attr[attributeKey]);
      };

      this.initialize = $.noop;
      this.teardown = teardown;
    }

    function attachTo(selector/*, options args */) {
      if (!selector) {
        throw new Error("Component needs to be attachTo'd a jQuery object, native node or selector string");
      }

      var options = utils.merge.apply(utils, utils.toArray(arguments, 1));

      $(selector).each(function(i, node) {
        new this(node, options);
      }.bind(this));
    }

    // define the constructor for a custom component type
    // takes an unlimited number of mixin functions as arguments
    // typical api call with 3 mixins: define(timeline, withTweetCapability, withScrollCapability);
    function define(/*mixins*/) {
      var mixins = utils.toArray(arguments);

      Component.toString = function() {
        var prettyPrintMixins = mixins.map(function(mixin) {
          if ($.browser.msie) {
            var m = mixin.toString().match(/function (.*?)\s?\(/);
            return (m && m[1]) ? m[1] : "";
          } else {
            return mixin.name;
          }
        }).join(', ').replace(/\s\,/g,'');//weed out no-named mixins

        return prettyPrintMixins;
      };

      Component.describe = Component.toString();

      //'options' is optional hash to be merged with 'defaults' in the component definition
      function Component(node, options) {
        var fnCache = {}, uuid = 0;

        if (!node) {
          throw new Error("Component needs a node");
        }

        if (node.jquery) {
          this.node = node[0];
          this.$node = node;
        } else {
          this.node = node;
          this.$node = $(node);
        }

        this.describe = this.constructor.describe;

        this.bind = function(func) {
          var bound;

          if (func.uuid && (bound = fnCache[func.uuid])) {
            return bound;
          }

          var bindArgs = utils.toArray(arguments, 1);
          bindArgs.unshift(this); //prepend context

          bound = func.bind.apply(func, bindArgs);
          bound.target = func;
          func.uuid = uuid++;
          fnCache[func.uuid] = bound;

          return bound;
        };

        //merge defaults with supplied options
        this.attr = utils.merge(this.defaults, options);
        this.defaults && Object.keys(this.defaults).forEach(function(key) {
          if (this.defaults[key] === null && this.attr[key] === null) {
            throw new Error('Required attribute "' + key + '" not specified in attachTo for component "' + this.describe + '".');
          }
        }, this);

        this.initialize.call(this, options || {});

        this.trigger('componentInitialized');
      }

      Component.attachTo = attachTo;
      Component.teardownAll = teardownAll;

      // prepend common mixins to supplied list, then mixin all flavors
      mixins.unshift(withBaseComponent, advice.withAdvice, registry.withRegistration);

      compose.mixin(Component.prototype, mixins);

      return Component;
    }

    define.teardownAll = function() {
      registry.components.slice().forEach(function(c) {
        c.component.teardownAll();
      });
      registry.reset();
    };

    return define;
  }
);

/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version 1.7.1
 */

(function(define) { 'use strict';
define('when/when',[],function () {
	var reduceArray, slice, undef;

	//
	// Public API
	//

	when.defer     = defer;     // Create a deferred
	when.resolve   = resolve;   // Create a resolved promise
	when.reject    = reject;    // Create a rejected promise

	when.join      = join;      // Join 2 or more promises

	when.all       = all;       // Resolve a list of promises
	when.map       = map;       // Array.map() for promises
	when.reduce    = reduce;    // Array.reduce() for promises

	when.any       = any;       // One-winner race
	when.some      = some;      // Multi-winner race

	when.chain     = chain;     // Make a promise trigger another resolver

	when.isPromise = isPromise; // Determine if a thing is a promise

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
	 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
	 *   will be invoked immediately.
	 * @param {function?} [onRejected] callback to be called when promiseOrValue is
	 *   rejected.
	 * @param {function?} [onProgress] callback to be called when progress updates
	 *   are issued for promiseOrValue.
	 * @returns {Promise} a new {@link Promise} that will complete with the return
	 *   value of callback or errback or the completion value of promiseOrValue if
	 *   callback and/or errback is not supplied.
	 */
	function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
		// Get a trusted promise for the input promiseOrValue, and then
		// register promise handlers
		return resolve(promiseOrValue).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Returns promiseOrValue if promiseOrValue is a {@link Promise}, a new Promise if
	 * promiseOrValue is a foreign promise, or a new, already-fulfilled {@link Promise}
	 * whose value is promiseOrValue if promiseOrValue is an immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @returns Guaranteed to return a trusted Promise.  If promiseOrValue is a when.js {@link Promise}
	 *   returns promiseOrValue, otherwise, returns a new, already-resolved, when.js {@link Promise}
	 *   whose resolution value is:
	 *   * the resolution value of promiseOrValue if it's a foreign promise, or
	 *   * promiseOrValue if it's a value
	 */
	function resolve(promiseOrValue) {
		var promise, deferred;

		if(promiseOrValue instanceof Promise) {
			// It's a when.js promise, so we trust it
			promise = promiseOrValue;

		} else {
			// It's not a when.js promise. See if it's a foreign promise or a value.
			if(isPromise(promiseOrValue)) {
				// It's a thenable, but we don't know where it came from, so don't trust
				// its implementation entirely.  Introduce a trusted middleman when.js promise
				deferred = defer();

				// IMPORTANT: This is the only place when.js should ever call .then() on an
				// untrusted promise. Don't expose the return value to the untrusted promise
				promiseOrValue.then(
					function(value)  { deferred.resolve(value); },
					function(reason) { deferred.reject(reason); },
					function(update) { deferred.progress(update); }
				);

				promise = deferred.promise;

			} else {
				// It's a value, not a promise.  Create a resolved promise for it.
				promise = fulfilled(promiseOrValue);
			}
		}

		return promise;
	}

	/**
	 * Returns a rejected promise for the supplied promiseOrValue.  The returned
	 * promise will be rejected with:
	 * - promiseOrValue, if it is a value, or
	 * - if promiseOrValue is a promise
	 *   - promiseOrValue's value after it is fulfilled
	 *   - promiseOrValue's reason after it is rejected
	 * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
	 * @return {Promise} rejected {@link Promise}
	 */
	function reject(promiseOrValue) {
		return when(promiseOrValue, rejected);
	}

	/**
	 * Trusted Promise constructor.  A Promise created from this constructor is
	 * a trusted when.js promise.  Any other duck-typed promise is considered
	 * untrusted.
	 * @constructor
	 * @name Promise
	 */
	function Promise(then) {
		this.then = then;
	}

	Promise.prototype = {
		/**
		 * Register a callback that will be called when a promise is
		 * fulfilled or rejected.  Optionally also register a progress handler.
		 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress)
		 * @param {function?} [onFulfilledOrRejected]
		 * @param {function?} [onProgress]
		 * @return {Promise}
		 */
		always: function(onFulfilledOrRejected, onProgress) {
			return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
		},

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		otherwise: function(onRejected) {
			return this.then(undef, onRejected);
		},

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @return {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		yield: function(value) {
			return this.then(function() {
				return value;
			});
		},

		/**
		 * Assumes that this promise will fulfill with an array, and arranges
		 * for the onFulfilled to be called with the array as its argument list
		 * i.e. onFulfilled.spread(undefined, array).
		 * @param {function} onFulfilled function to receive spread arguments
		 * @return {Promise}
		 */
		spread: function(onFulfilled) {
			return this.then(function(array) {
				// array may contain promises, so resolve its contents.
				return all(array, function(array) {
					return onFulfilled.apply(undef, array);
				});
			});
		}
	};

	/**
	 * Create an already-resolved promise for the supplied value
	 * @private
	 *
	 * @param {*} value
	 * @return {Promise} fulfilled promise
	 */
	function fulfilled(value) {
		var p = new Promise(function(onFulfilled) {
			// TODO: Promises/A+ check typeof onFulfilled
			try {
				return resolve(onFulfilled ? onFulfilled(value) : value);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Create an already-rejected {@link Promise} with the supplied
	 * rejection reason.
	 * @private
	 *
	 * @param {*} reason
	 * @return {Promise} rejected promise
	 */
	function rejected(reason) {
		var p = new Promise(function(_, onRejected) {
			// TODO: Promises/A+ check typeof onRejected
			try {
				return onRejected ? resolve(onRejected(reason)) : rejected(reason);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Creates a new, Deferred with fully isolated resolver and promise parts,
	 * either or both of which may be given out safely to consumers.
	 * The Deferred itself has the full API: resolve, reject, progress, and
	 * then. The resolver has resolve, reject, and progress.  The promise
	 * only has then.
	 *
	 * @return {Deferred}
	 */
	function defer() {
		var deferred, promise, handlers, progressHandlers,
			_then, _progress, _resolve;

		/**
		 * The promise for the new deferred
		 * @type {Promise}
		 */
		promise = new Promise(then);

		/**
		 * The full Deferred object, with {@link Promise} and {@link Resolver} parts
		 * @class Deferred
		 * @name Deferred
		 */
		deferred = {
			then:     then, // DEPRECATED: use deferred.promise.then
			resolve:  promiseResolve,
			reject:   promiseReject,
			// TODO: Consider renaming progress() to notify()
			progress: promiseProgress,

			promise:  promise,

			resolver: {
				resolve:  promiseResolve,
				reject:   promiseReject,
				progress: promiseProgress
			}
		};

		handlers = [];
		progressHandlers = [];

		/**
		 * Pre-resolution then() that adds the supplied callback, errback, and progback
		 * functions to the registered listeners
		 * @private
		 *
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 */
		_then = function(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			var deferred, progressHandler;

			deferred = defer();

			progressHandler = typeof onProgress === 'function'
				? function(update) {
					try {
						// Allow progress handler to transform progress event
						deferred.progress(onProgress(update));
					} catch(e) {
						// Use caught value as progress
						deferred.progress(e);
					}
				}
				: function(update) { deferred.progress(update); };

			handlers.push(function(promise) {
				promise.then(onFulfilled, onRejected)
					.then(deferred.resolve, deferred.reject, progressHandler);
			});

			progressHandlers.push(progressHandler);

			return deferred.promise;
		};

		/**
		 * Issue a progress event, notifying all progress listeners
		 * @private
		 * @param {*} update progress event payload to pass to all listeners
		 */
		_progress = function(update) {
			processQueue(progressHandlers, update);
			return update;
		};

		/**
		 * Transition from pre-resolution state to post-resolution state, notifying
		 * all listeners of the resolution or rejection
		 * @private
		 * @param {*} value the value of this deferred
		 */
		_resolve = function(value) {
			value = resolve(value);

			// Replace _then with one that directly notifies with the result.
			_then = value.then;
			// Replace _resolve so that this Deferred can only be resolved once
			_resolve = resolve;
			// Make _progress a noop, to disallow progress for the resolved promise.
			_progress = noop;

			// Notify handlers
			processQueue(handlers, value);

			// Free progressHandlers array since we'll never issue progress events
			progressHandlers = handlers = undef;

			return value;
		};

		return deferred;

		/**
		 * Wrapper to allow _then to be replaced safely
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 * @return {Promise} new promise
		 */
		function then(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			return _then(onFulfilled, onRejected, onProgress);
		}

		/**
		 * Wrapper to allow _resolve to be replaced
		 */
		function promiseResolve(val) {
			return _resolve(val);
		}

		/**
		 * Wrapper to allow _reject to be replaced
		 */
		function promiseReject(err) {
			return _resolve(rejected(err));
		}

		/**
		 * Wrapper to allow _progress to be replaced
		 */
		function promiseProgress(update) {
			return _progress(update);
		}
	}

	/**
	 * Determines if promiseOrValue is a promise or not.  Uses the feature
	 * test from http://wiki.commonjs.org/wiki/Promises/A to determine if
	 * promiseOrValue is a promise.
	 *
	 * @param {*} promiseOrValue anything
	 * @returns {boolean} true if promiseOrValue is a {@link Promise}
	 */
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 * resolved first, or will reject with an array of (promisesOrValues.length - howMany) + 1
	 * rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		checkCallbacks(2, arguments);

		return when(promisesOrValues, function(promisesOrValues) {

			var toResolve, toReject, values, reasons, deferred, fulfillOne, rejectOne, progress, len, i;

			len = promisesOrValues.length >>> 0;

			toResolve = Math.max(0, Math.min(howMany, len));
			values = [];

			toReject = (len - toResolve) + 1;
			reasons = [];

			deferred = defer();

			// No items in the input, resolve immediately
			if (!toResolve) {
				deferred.resolve(values);

			} else {
				progress = deferred.progress;

				rejectOne = function(reason) {
					reasons.push(reason);
					if(!--toReject) {
						fulfillOne = rejectOne = noop;
						deferred.reject(reasons);
					}
				};

				fulfillOne = function(val) {
					// This orders the values based on promise resolution order
					// Another strategy would be to use the original position of
					// the corresponding promise.
					values.push(val);

					if (!--toResolve) {
						fulfillOne = rejectOne = noop;
						deferred.resolve(values);
					}
				};

				for(i = 0; i < len; ++i) {
					if(i in promisesOrValues) {
						when(promisesOrValues[i], fulfiller, rejecter, progress);
					}
				}
			}

			return deferred.then(onFulfilled, onRejected, onProgress);

			function rejecter(reason) {
				rejectOne(reason);
			}

			function fulfiller(val) {
				fulfillOne(val);
			}

		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		checkCallbacks(1, arguments);
		return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @return {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return map(arguments, identity);
	}

	/**
	 * Traditional map function, similar to `Array.prototype.map()`, but allows
	 * input to contain {@link Promise}s and/or values, and mapFunc may return
	 * either a value or a {@link Promise}
	 *
	 * @param {Array|Promise} promise array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function} mapFunc mapping function mapFunc(value) which may return
	 *      either a {@link Promise} or value
	 * @returns {Promise} a {@link Promise} that will resolve to an array containing
	 *      the mapped output values.
	 */
	function map(promise, mapFunc) {
		return when(promise, function(array) {
			var results, len, toResolve, resolve, i, d;

			// Since we know the resulting length, we can preallocate the results
			// array to avoid array expansions.
			toResolve = len = array.length >>> 0;
			results = [];
			d = defer();

			if(!toResolve) {
				d.resolve(results);
			} else {

				resolve = function resolveOne(item, i) {
					when(item, mapFunc).then(function(mapped) {
						results[i] = mapped;

						if(!--toResolve) {
							d.resolve(results);
						}
					}, d.reject);
				};

				// Since mapFunc may be async, get all invocations of it into flight
				for(i = 0; i < len; i++) {
					if(i in array) {
						resolve(array[i], i);
					} else {
						--toResolve;
					}
				}

			}

			return d.promise;

		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = slice.call(arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	/**
	 * Ensure that resolution of promiseOrValue will trigger resolver with the
	 * value or reason of promiseOrValue, or instead with resolveValue if it is provided.
	 *
	 * @param promiseOrValue
	 * @param {Object} resolver
	 * @param {function} resolver.resolve
	 * @param {function} resolver.reject
	 * @param {*} [resolveValue]
	 * @returns {Promise}
	 */
	function chain(promiseOrValue, resolver, resolveValue) {
		var useResolveValue = arguments.length > 2;

		return when(promiseOrValue,
			function(val) {
				val = useResolveValue ? resolveValue : val;
				resolver.resolve(val);
				return val;
			},
			function(reason) {
				resolver.reject(reason);
				return rejected(reason);
			},
			resolver.progress
		);
	}

	//
	// Utility functions
	//

	/**
	 * Apply all functions in queue to value
	 * @param {Array} queue array of functions to execute
	 * @param {*} value argument passed to each function
	 */
	function processQueue(queue, value) {
		var handler, i = 0;

		while (handler = queue[i++]) {
			handler(value);
		}
	}

	/**
	 * Helper that checks arrayOfCallbacks to ensure that each element is either
	 * a function, or null or undefined.
	 * @private
	 * @param {number} start index at which to start checking items in arrayOfCallbacks
	 * @param {Array} arrayOfCallbacks array to check
	 * @throws {Error} if any element of arrayOfCallbacks is something other than
	 * a functions, null, or undefined.
	 */
	function checkCallbacks(start, arrayOfCallbacks) {
		// TODO: Promises/A+ update type checking and docs
		var arg, i = arrayOfCallbacks.length;

		while(i > start) {
			arg = arrayOfCallbacks[--i];

			if (arg != null && typeof arg != 'function') {
				throw new Error('arg '+i+' must be a function');
			}
		}
	}

	/**
	 * No-Op function used in method replacement
	 * @private
	 */
	function noop() {}

	slice = [].slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.
	reduceArray = [].reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/

			// ES5 dictates that reduce.length === 1

			// This implementation deviates from ES5 spec in the following ways:
			// 1. It does not check if reduceFunc is a Callable

			var arr, args, reduced, len, i;

			i = 0;
			// This generates a jshint warning, despite being valid
			// "Missing 'new' prefix when invoking a constructor."
			// See https://github.com/jshint/jshint/issues/392
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				// Skip holes
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	function identity(x) {
		return x;
	}

	return when;
});
})(typeof define == 'function' && define.amd
	? define
	: function (factory) { typeof exports === 'object'
		? (module.exports = factory())
		: (this.when      = factory());
	}
	// Boilerplate for AMD, Node, and browser global
);

define('when', ['when/when'], function (main) { return main; });

'use strict';

define('js/services/Ajax',
[
	'when',
	'underscore',
], function(when, _) {

	var playerSpeed = 0;
	var playerTime = {};
	var totalTime = getTime(1300);
	var currentItem;

	function get_result(command, params) {
		var match = _.find(RETURN_VARS[command], function(item) {
			return (typeof item.when == 'function' ? item.when(params) : item.when);
		});
		var result = (match ? match.result : {error : "No stubbed method exists"});
		if (typeof result == 'function') {
			result = result(params);
		}
		return result;
	}

	function fromTime(time) {
		return time.hours * 3600 + time.minutes * 60 + time.seconds;
	}

	function getTime(seconds) {
		return {
			hours : Math.floor(seconds / 3600),
			minutes : Math.floor((seconds % 3600) / 60),
			seconds : Math.floor(seconds % 60)
		}
	}

	setInterval(function() {
		playerTime = getTime(fromTime(playerTime) + playerSpeed);
		if (fromTime(playerTime) > fromTime(totalTime)) {
			currentItem = null;
		}
	}, 1000);

	var RETURN_VARS = {
		"Player.PlayPause" : [
			{
				when : true,
				result : function() {
					playerSpeed = (playerSpeed === 1 ? 0 : 1);
					return { playerid : 1, speed : playerSpeed };
				}
			}
		],
		"Player.Open" : [
			{
				when : true,
				result : function(params) {
					var collection = (params.item.movieid ?
									  get_result('VideoLibrary.GetMovies').movies :
									  get_result('VideoLibrary.GetEpisodes', { tvshowid : Math.floor((params.item.episodeid - 1) / 9) + 1 }).episodes);
					currentItem = _.findWhere( collection, params.item );
					playerTime = getTime(0);
					playerSpeed = 1;

					return {};
				}
			}
		],
		"Player.GetProperties" : [
			{
				when : true,
				result : function(params) {
					return { playerid : 1, speed : playerSpeed, time : playerTime, totaltime : totalTime };
				}
			}
		],
		"Player.GetItem" : [
			{
				when : true,
				result : function() {
					return { item : currentItem };
				}
			}
		],
		"Player.GetActivePlayers" : [
			{
				when : true,
				result : function() {
					return (currentItem ? [{playerid : 1, type : 'video' }] : []);
				}
			}
		],
		"VideoLibrary.GetMovies" : [
			{
				when : true,
				result : {
					movies : [
						{ movieid : 1, year : 1985, title : 'Clue',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/suzDcrxpuNPDnBwOOy8vBLsygwp.jpg' },
							plot : "Clue finds six colorful dinner guests gathered at the mansion of their host, Mr. Boddy -- who turns up dead after his secret is exposed: He was blackmailing all of them. With the killer among them, the guests and Boddy's chatty butler must suss out the culprit before the body count rises.",
							cast : [{"name":"Lesley Ann Warren","role":"Miss Scarlet"},{"name":"Christopher Lloyd","role":"Professor Plum"},{"name":"Eileen Brennan","role":"Mrs. Peacock"},{"name":"Tim Curry","role":"Wadsworth"},{"name":"Madeline Kahn","role":"Mrs. White"},{"name":"Martin Mull","role":"Colonel Mustard"},{"name":"Michael McKean","role":"Mr. Green"},{"name":"Colleen Camp","role":"Yvette"},{"name":"Lee Ving","role":"Mr. Boddy"},{"name":"Bill Henderson","role":"The Cop"},{"name":"Jane Wiedlin","role":"The Singing Telegram"}]
						},
						{ movieid : 2, year : 2009, title : 'District 9',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/axFmCRNQsW6Bto8XuJKo08MPPV5.jpg' },
							plot : "Aliens land in South Africa and have no way home. Years later after living in a slum and wearing out their welcome the \"Non-Humans\" are being moved to a new tent city overseen by Multi-National United (MNU). The movie follows an MNU employee tasked with leading the relocation and his relationship with one of the alien leaders.",
							cast : [{"name":"William Allen Young","role":"Dirk Michaels"},{"name":"Robert Hobbs","role":"Ross Pienaar"},{"name":"Sharlto Copley","role":"Wikus van der Merwe"},{"name":"Jason Cope","role":"Grey Bradnam"},{"name":"Vanessa Haywood","role":"Tania Van De Merwe"},{"name":"Kenneth Nkosi","role":"Thomas"}]
						},
						{ movieid : 3, year : 2002, title : 'Harry Potter and the Chamber of Secrets',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/lryNn7sNkvQIg45KwgeKnMxSSRX.jpg' },
							plot : "Everyone's favorite novice wizard, Harry Potter, continues his high-flying adventures at Hogwarts. This time around, Harry ignores warnings not to return to school - that is, if he values his life - to investigate a mysterious series of attacks with Ron and Hermione.",
							cast : [{"name":"Daniel Radcliffe","role":"Harry Potter"},{"name":"Rupert Grint","role":"Ron Weasley"},{"name":"Emma Watson","role":"Hermione Granger"},{"name":"Martin Bayfield","role":"Young Rubeus Hagrid"},{"name":"Heather Bleasdale","role":"Mrs Granger"},{"name":"Sean Biggerstaff","role":"Oliver Wood"},{"name":"David Bradley","role":"Argus Filch"},{"name":"Kenneth Branagh","role":"Gilderoy Lockhart"},{"name":"Veronica Clifford","role":"Mrs Mason"},{"name":"John Cleese","role":"Nearly Headless Nick"},{"name":"Robbie Coltrane","role":"Rubeus Hagrid"},{"name":"Eleanor Columbus","role":"Susan Bones"},{"name":"Christian Coulson","role":"Tom Marvolo Riddle"},{"name":"Warwick Davis","role":"Filius Flitwick"},{"name":"Emily Dale","role":"Katie Bell"},{"name":"Rochelle Douglas","role":"Alicia Spinnet"},{"name":"Richard Griffiths","role":"Uncle Vernon Dursley"},{"name":"Julie Walters","role":"Molly Weasley"},{"name":"Matthew Lewis","role":"Neville Longbottom"},{"name":"Alan Rickman","role":"Severus Snape"},{"name":"Richard Harris","role":"Albus Dumbledore"},{"name":"Tom Felton","role":"Draco Malfoy"},{"name":"Leslie Phillips","role":"The Sorting Hat (voice)"},{"name":"Jason Isaacs","role":"Lucius Malfoy"},{"name":"Maggie Smith","role":"Professor Minerva McGonagall"}]
						},
						{ movieid : 4, year : 1992, title : 'My Cousin Vinny',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/2lhWjSkRHZREw5wXoWHO88lpODe.jpg' },
							plot : "Two carefree pals traveling through Alabama are mistakenly arrested, and charged with murder. Fortunately, one of them has a cousin who's a lawyer - Vincent Gambini, a former auto mechanic from Brooklyn who just passed his bar exam after his sixth try. When he arrives with his leather-clad girlfriend , to try his first case, it's a real shock - for him and the Deep South!",
							cast : [{"name":"Joe Pesci","role":"Vincent 'Vinny' Gambini"},{"name":"Ralph Macchio","role":"William 'Billy' Gambini"},{"name":"Marisa Tomei","role":"Mona Lisa Vito"},{"name":"Mitchell Whitfield","role":"Stan Rothenstein"},{"name":"Fred Gwynne","role":"Judge Chamberlain Haller"}]
						},
						{ movieid : 5, year : 2005, title : 'Serenity',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/iaE3I86DtOfb8a1Kmsko3Gbr6fq.jpg' },
							plot : "When the renegade crew of Serenity agrees to hide a fugitive on their ship, they find themselves in an action-packed battle between the relentless military might of a totalitarian regime who will destroy anything - or anyone - to get the girl back and the bloodthirsty creatures who roam the uncharted areas of space. But, the greatest danger of all may be on their ship.",
							cast : [{"name":"Nathan Fillion","role":"Mal"},{"name":"Gina Torres","role":"Zoe"},{"name":"Alan Tudyk","role":"Wash"},{"name":"Morena Baccarin","role":"Inara"},{"name":"Adam Baldwin","role":"Jayne"},{"name":"Jewel Staite","role":"Kaylee"},{"name":"Sean Maher","role":"Simon"},{"name":"Summer Glau","role":"River"},{"name":"Ron Glass","role":"Shepherd Book"},{"name":"Chiwetel Ejiofor","role":"The Operative"},{"name":"David Krumholtz","role":"Mr. Universe"},{"name":"Michael Hitchcock","role":"Dr. Mathias"},{"name":"Sarah Paulson","role":"Dr. Caron"},{"name":"Yan Feldman","role":"Mingo"},{"name":"Rafael Feldman","role":"Fanty"},{"name":"Nectar Rose","role":"Lenore"},{"name":"Tamara Taylor","role":"Teacher"},{"name":"Glenn Howerton","role":"Lilac Young Tough"},{"name":"Hunter Ansley Wryn","role":"Young River"},{"name":"Logan O'Brien","role":"Boy Student"},{"name":"Erik Erotas","role":"Boy Student"},{"name":"Demetra Raven","role":"Girl Student"},{"name":"Jessica Huang","role":"Girl Student"},{"name":"Marley McClean","role":"Girl Student"},{"name":"Scott Kinworthy","role":"Ensign"},{"name":"Erik Weiner","role":"Helmsman"},{"name":"Conor O'Brien","role":"Lab Technician"},{"name":"Peter James Smith","role":"Lab Technician"},{"name":"Weston Nathanson","role":"Trade Agent"},{"name":"Carrie 'CeCe' Cline","role":"Young Female Intern"},{"name":"Chuck O'Neil","role":"Vault Guard"},{"name":"Amy Wieczorek","role":"Lilac Mom"},{"name":"Tristan Jarred","role":"Lilac Son"},{"name":"Elaine Mani Lee","role":"Fan Dancer"},{"name":"Terrence Hardy Jr.","role":"Mining Camp Boy"},{"name":"Brian O'Hare","role":"Alliance Pilot"},{"name":"Ryan Tasz","role":"Black Room Soldier"},{"name":"Colin Patrick Lynch","role":"Black Room Soldier"},{"name":"Terrell Tilford","role":"News Anchor"},{"name":"Joshua Michael Kwiat","role":"Slovenly Beaumonde Man"},{"name":"Antonio Rufino","role":"Bartender"},{"name":"Linda Wang","role":"Chinese snake dancer"},{"name":"Mark Winn","role":"Futuristic Worker"}]
						},
					]
				}
			}
		],
		"VideoLibrary.GetTVShows" : [
			{
				when : true,
				result : {
					tvshows : [
						{
							art : {
								banner : 'http://thetvdb.com/banners/graphical/73255-g22.jpg'
							},
							title : 'House',
							tvshowid : 1
						},
						{
							art : {
								banner : 'http://thetvdb.com/banners/graphical/80379-g23.jpg'
							},
							title : 'The Big Bang Theory',
							tvshowid : 2
						},
						{
							art : {
								banner : 'http://thetvdb.com/banners/graphical/83462-g5.jpg'
							},
							title : 'Castle',
							tvshowid : 3
						}
					]
				}
			}
		],
		"VideoLibrary.GetSeasons" : [
			{
				when : function(data) { return data.tvshowid == 1; },
				result : {
					seasons : [
						{ season : 1, showtitle : 'House', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/73255-1-13.jpg' } },
						{ season : 2, showtitle : 'House', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/73255-2-11.jpg' } },
						{ season : 3, showtitle : 'House', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/73255-3-2.jpg' } }
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 2; },
				result : {
					seasons : [
						{ season : 1, showtitle : 'The Big Bang Theory', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/80379-1-10.jpg' } },
						{ season : 2, showtitle : 'The Big Bang Theory', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/80379-2-4.jpg' } },
						{ season : 3, showtitle : 'The Big Bang Theory', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/80379-3-7.jpg' } }
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 3; },
				result : {
					seasons : [
						{ season : 1, showtitle : 'Castle', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/83462-1.jpg' } },
						{ season : 2, showtitle : 'Castle', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/83462-2-2.jpg' } },
						{ season : 3, showtitle : 'Castle', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/83462-3-5.jpg' } }
					]
				}
			}
		],
		"VideoLibrary.GetEpisodes" : [
			{
				when : function(data) { return data.tvshowid == 1; },
				result : {
					episodes : [
						{ season : 1, episode : 1, showtitle : 'House', tvshowid : 1, episodeid : 1, title : 'Pilot',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/110994.jpg' },
							plot : "A Kindergarten teacher starts speaking gibberish and passed out in front of her class. What looks like a possible brain tumor does not respond to treatment and provides many more questions than answers for House and his team as they engage in a risky trial-and-error approach to her case. When the young teacher refuses any additional variations of treatment and her life starts slipping away, House must act against his code of conduct and make a personal visit to his patient to convince her to trust him one last time.",
							cast : []
						},
						{ season : 1, episode : 2, showtitle : 'House', tvshowid : 1, episodeid : 2, title : 'Paternity',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/110995.jpg' },
							plot : "When a teenage lacrosse player is stricken with an unidentifiable brain disease, Dr. House and the team hustle to give his parents answers. Chase breaks the bad news, the kid has MS, but the boy's night-terror hallucinations disprove the diagnosis and send House and his team back to square one. As the boy's health deteriorates. House's side-bet on the paternity of the patient infuriates Dr. Cuddy and the teenager's parents, but may just pay off in spades.",
							cast : []
						},
						{ season : 1, episode : 3, showtitle : 'House', tvshowid : 1, episodeid : 3, title : 'Occam\'s Razor',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/110996.jpg' },
							plot : "A college student collapses after rowdy sex with his girlfriend.  While House and his team attempt to determine the cause, the student's condition continues to deteriorate and his symptoms multiply complicating the diagnosis.",
							cast : []
						},
						{ season : 2, episode : 1, showtitle : 'House', tvshowid : 1, episodeid : 4, title : 'Acceptance',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/306189.jpg' },
							plot : "A death row inmate is felled by an unknown disease and House decides to take on the case, over Cuddy and Foreman's objections. House also has to deal with Stacy who is working closely with him, while Cameron has to cope with a dying patient.",
							cast : []
						},
						{ season : 2, episode : 2, showtitle : 'House', tvshowid : 1, episodeid : 5, title : 'Autopsy',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/306190.jpg' },
							plot : "Dr. Wilson convinces House to take the case of one of his patients, a young girl with terminal cancer who starts suffering from hallucinations.",
							cast : []
					   	},
						{ season : 2, episode : 3, showtitle : 'House', tvshowid : 1, episodeid : 6, title : 'Humpty Dumpty',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/306191.jpg' },
							plot : "An asthmatic man suddenly becomes unconscious and falls off of Dr. Cuddy's roof while working on her house.",
							cast : []
					   	},
						{ season : 3, episode : 1, showtitle : 'House', tvshowid : 1, episodeid : 7, title : 'Meaning',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/307551.jpg' },
							plot : "After recovering from his gunshot wounds, House works feverishly on two cases at the same time: a paralyzed man who drove his wheelchair into a swimming pool and a woman who became paralyzed after a yoga session.",
							cast : []
					   	},
						{ season : 3, episode : 2, showtitle : 'House', tvshowid : 1, episodeid : 8, title : 'Cane & Able',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/307552.jpg' },
							plot : "House and the team treat a young boy who claims there is a tracking device in his neck and believes he has been the subject of alien experimentation. Cameron is outraged when she learns Cuddy and Wilson have been lying to House about the diagnosis on his last case.",
							cast : []
					   	},
						{ season : 3, episode : 3, showtitle : 'House', tvshowid : 1, episodeid : 9, title : 'Informed Consent',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/307553.jpg' },
							plot : "House puts a well-known medical researcher through a battery of tests to determine why he collapsed in his lab. When the team is unable to diagnose the problem, the doctor asks the team to help him end his life. House is forced to use his cane again after the ketamine has worn off as he deals with a clinic patient's teenaged daughter who has a crush on him.",
							cast : []
					   	}
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 2; },
				result : {
					episodes : [
						{ season : 1, episode : 1, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 10, title : 'Pilot',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/332484.jpg' },
							plot : "Brilliant physicist roommates Leonard and Sheldon meet their new neighbor Penny, who begins showing them that as much as they know about science, they know little about actual living.",
							cast : []
						},
						{ season : 1, episode : 2, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 11, title : 'The Big Bran Hypothesis',
							art : { thumb : 'http://thetvdb.com/banners/episodes/80379/337065.jpg' },
							plot : "Leonard volunteers to sign for a package in an attempt to make a good impression on Penny, but when he enlists Sheldon for help, his attempt at chivalry goes terribly awry.",
							cast : []
						},
						{ season : 1, episode : 3, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 12, title : 'The Fuzzy Boots Corollary',
							art : { thumb : 'http://thetvdb.com/banners/episodes/80379/337249.jpg' },
							plot : "Leonard asks a woman out after he finds out that Penny is seeing someone.",
							cast : []
						},
						{ season : 2, episode : 1, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 13, title : 'The Bad Fish Paradigm',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/387721.jpg' },
							plot : "Penny's first date with Leonard goes awry; Penny finds Sheldon to be an unwilling confidant.",
							cast : []
						},
						{ season : 2, episode : 2, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 14, title : 'The Codpiece Topology',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/389025.jpg' },
							plot : "A jealous Leonard reacts to Penny's new guy by rebounding with Leslie.",
							cast : []
					   	},
						{ season : 2, episode : 3, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 15, title : 'The Barbarian Simulation',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/391204.jpg' },
							plot : "Sheldon creates a monster when he introduces Penny to online gaming.",
							cast : []
					   	},
						{ season : 3, episode : 1, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 16, title : 'The Electric Can Opener Fluctuation',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/795681.jpg' },
							plot : "When Sheldon learns the guys tampered with his expedition data he got from the arctic, he leaves to Texas in disgrace. This results in the guys following him, which threatens Leonard's hope for some romantic time with Penny and the guys' friendship with Sheldon.",
							cast : []
					   	},
						{ season : 3, episode : 2, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 17, title : 'The Jiminy Conjecture',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/1046141.jpg' },
							plot : "Leonard and Penny struggle to recover from an awkward first hookup while Sheldon and Howard stake their best comic books on a bet to determine the species of a cricket.",
							cast : []
					   	},
						{ season : 3, episode : 3, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 18, title : 'The Gothowitz Deviation',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/1101931.jpg' },
							plot : "Howard and Raj visit a Goth nightclub to pick up women while Sheldon attempts to build a better Penny using chocolate-based behavior modification.",
							cast : []
					   	}
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 3; },
				result : {
					episodes : [
						{ season : 1, episode : 1, showtitle : 'Castle', tvshowid : 3, episodeid : 19, title : 'Flowers for Your Grave',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/398671.jpg' },
							plot : "Author Richard Castle joins NYC Detective Kate Beckett to help solve the case of a serial killer who is reenacting murders from Castle's novels; Castle becomes very intrigued with the murders and continues to shadow Beckett, much to her chagrin.",
							cast : []
						},
						{ season : 1, episode : 2, showtitle : 'Castle', tvshowid : 3, episodeid : 20, title : 'Nanny McDead',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/424159.jpg' },
							plot : "When a body of a young woman is found inside the dryer at a laundry room, Castle and Beckett uncover that the young woman worked as a nanny in the upscale building. Meanwhile, as Castle works on his \"Nikki Heat\" novel series he watches Beckett's actions as she works the murder case.",
							cast : []
						},
						{ season : 1, episode : 3, showtitle : 'Castle', tvshowid : 3, episodeid : 21, title : 'Hedge Fund Homeboys',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/424160.jpg' },
							plot : "When a teenaged boy whose family has recently fallen on hard times is found dead in a boat in Central Park, Castle and Beckett must piece together the mystery behind the boy's final moments. Meanwhile, Castle mulls over leaving Martha home while he chaperones Alexis' trip to Washington, D.C.",
							cast : []
						},
						{ season : 2, episode : 1, showtitle : 'Castle', tvshowid : 3, episodeid : 22, title : 'Deep in Death',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/792761.jpg' },
							plot : "When the new season begins, Castle is wrestling with how to repair his relationship with Beckett, while struggling to finish his soon-to-be-published bestseller, Heat Wave. But circumstances force the pair back together to investigate the mysterious murder of a man found dead, tangled in the limbs of a tree.",
							cast : []
						},
						{ season : 2, episode : 2, showtitle : 'Castle', tvshowid : 3, episodeid : 23, title : 'The Double Down',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/1101941.jpg' },
							plot : "When two separate murders are committed on the same night, Castle wagers Ryan and Esposito that he and Beckett will solve theirs first. The frenzied race to catch their respective killers and win the bet leads each investigative duo to a likely suspect, only to find that they both have airtight alibis. But bizarre twists in both cases force the two teams to work together to unravel the mind-bending mystery behind each murder.",
							cast : []
					   	},
						{ season : 2, episode : 3, showtitle : 'Castle', tvshowid : 3, episodeid : 24, title : 'Inventing the Girl',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/1103021.jpg' },
							plot : "Castle and Beckett get an inside look at the cutthroat world of the New York fashion industry when they investigate the brutal murder of a young model during Fashion Week.",
							cast : []
					   	},
						{ season : 3, episode : 1, showtitle : 'Castle', tvshowid : 3, episodeid : 25, title : 'A Deadly Affair',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/2432571.jpg' },
							plot : "When Beckett and her team burst into an apartment on a murderer's trail, they see Castle standing over a dead woman's body holding a gun; Beckett arrests Castle as he asserts his innocence.",
							cast : []
					   	},
						{ season : 3, episode : 2, showtitle : 'Castle', tvshowid : 3, episodeid : 26, title : 'He\'s Dead, She\'s Dead',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/2744841.jpg' },
							plot : "Beckett and Castle search for a psychic's killer while debating the existence of extrasensory abilities.",
							cast : []
					   	},
						{ season : 3, episode : 3, showtitle : 'Castle', tvshowid : 3, episodeid : 27, title : 'Under the Gun',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/2744851.jpg' },
							plot : "When a coded document attracts Castle's attention, Beckett must steer the case back to the violent felons who populated their victim's world; when Beckett's ex-partner arrives, Castle must watch the relationship become romantic.",
							cast : []
					   	}
					]
				}
			}
		]
	};

	return {
		post : function(url, data) {
			var command = /jsonrpc\?(.*)$/.exec(url)[1];
			var result = get_result(command, data.params);
			var deferred = when.defer();
			setTimeout( function() { deferred.resolve({result : result}); }, 300);

			console.log("Command: ", command, " Params: ", data.params);
			console.log("  -> ", result);

			return deferred.promise;
		}
	};
});

'use strict';

define('js/services/XbmcRpc',
[
	'js/services/Ajax',
],
function(Ajax) {
	var id = 0;
	var _undef;

	function sendCommand(command, params) {
		// filter params to remove any undefined values
		if (!params) { params = {}; }
		for (var parameter in params) {
			if (params[parameter] === _undef) {
				delete params[parameter];
			}
		}
		return Ajax.post('/jsonrpc?' + command, {
			"id"      : id++,
			"jsonrpc" : "2.0",
			"method"  : command,
			"params"  : params,
		}).then(function(response) {
			// TODO - Does XBMC really return *both* of these? JSON-RPC says it should be singular...
			if (response.hasOwnProperty('result')) {
				return response.result;
			} else if (response.hasOwnProperty('results')) {
				return response.results;
			} else {
				throw "JSON-RPC Failed (method : " + command + ")" + JSON.stringify(response);
			}
		});
	}

	return {
		Input : {
			/**
			 * 5.6.1 Input.Back - Goes back in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Back
			 *
			 * @returns {RpcPromise}
			 */
			Back : function() {
				return sendCommand('Input.Back', null);
			},
			/**
			 * 5.6.2 Input.ContextMenu - Shows the context menu
			 *
			 * @returns {RpcPromise}
			 */
			ContextMenu : function() {
				return sendCommand('Input.ContextMenu', null);
			},
			/**
			 * 5.6.3 Input.Down - Navigate down in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Down
			 *
			 * @returns {RpcPromise}
			 */
			Down : function() {
				return sendCommand('Input.Down', null);
			},
			/**
			 * 5.6.4 Input.ExecuteAction - Execute a specific action
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.ExecuteAction
			 *
			 * @param {Input.Action} action
			 * @returns {RpcPromise}
			 */
			ExecuteAction : function(action) {
				return sendCommand('Input.ExecuteAction', {
					"action" : action,
				});
			},
			/**
			 * 5.6.5 Input.Home - Goes to home window in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Home
			 *
			 * @returns {RpcPromise}
			 */
			Home : function() {
				return sendCommand('Input.Home', null);
			},
			/**
			 * 5.6.7 Input.Left - Navigate left in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Left
			 *
			 * @returns {RpcPromise}
			 */
			Left : function() {
				return sendCommand('Input.Left', null);
			},
			/**
			 * 5.6.8 Input.Right - Navigate right in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Right
			 *
			 * @returns {RpcPromise}
			 */
			Right : function() {
				return sendCommand('Input.Right', null);
			},
			/**
			 * 5.6.9 Input.Select - Select current item in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Select
			 *
			 * @returns {RpcPromise}
			 */
			Select : function() {
				return sendCommand('Input.Select', null);
			},
			/**
			 * 5.6.12 Input.ShowOSD - Show the on-screen display for the current player
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.ShowOSD
			 *
			 * @returns {RpcPromise}
			 */
			ShowOSD : function() {
				return sendCommand('Input.ShowOSD', null);
			},
			/**
			 * 5.6.13 Input.Up - Navigate up in GUI
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Input.Up
			 *
			 * @returns {RpcPromise}
			 */
			Up : function() {
				return sendCommand('Input.Up', null);
			},
		},
		Player : {
			/**
			 * 5.9.1 Player.GetActivePlayers - Returns all active players
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.GetActivePlayers
			 *
			 * @returns {RpcPromise}
			 */
			GetActivePlayers : function() {
				return sendCommand('Player.GetActivePlayers', null);
			},
			/**
			 * 5.9.2 Player.GetItem - Retrieves the currently played item
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.GetItem
			 *
			 * @param {Player.Id} playerid
			 * @param {List.Fields.All} properties
			 * @returns {RpcPromise}
			 */
			GetItem : function(playerid, properties) {
				return sendCommand('Player.GetItem', {
					"playerid"   : playerid,
					"properties" : (Array.isArray(properties) ? properties : [properties]),
				})
			},
			/**
			 * 5.9.3 Player.GetProperties - Retrieves the values of the given properties
			 *
			 * @param {Player.Id} playerid
			 * @param {Array.<Player.Property.Name>} properties
			 * @returns {RpcPromise}
			 */
			GetProperties : function(playerid, properties) {
				return sendCommand('Player.GetProperties', {
					"playerid"   : playerid,
					"properties" : (properties ? (Array.isArray(properties) ? properties : [properties]) : null),
				});
			},
			/**
			 * 5.9.6 Player.Open - Start playback of either the playlist with the given ID,
			 *                     a slideshow with the pictures from the given directory or
			 *                     a single file or an item from the database.
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.Open
			 *
			 * @param {*=} item
			 * @param {object=} options
			 * @returns {RpcPromise}
			 */
			// TODO - it would appear the mapping from arguments to rpc method properties is not enforced
			Open : function(item) {
				return sendCommand('Player.Open', item);
			},
			/**
			 * 5.9.7 Player.PlayPause - Pauses or unpause playback and returns the new state
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.PlayPause
			 *
			 * @param {Player.Id} playerid
			 * @param {Global.Toggle} play [default: "toggle"]
			 * @returns {RpcPromise}
			 */
			PlayPause : function(playerid) {
				return sendCommand('Player.PlayPause', {
					"playerid" : playerid,
				});
			},
			/**
			 * 5.9.14 Player.SetSpeed - Set the speed of the current playback
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.SetSpeed
			 *
			 * @param {Player.Id} playerid
			 * @param {*} speed
			 * @returns {RpcPromise}
			 */
			SetSpeed : function(playerid, speed) {
				return sendCommand('Player.SetSpeed', {
					"playerid" : playerid,
					"speed"    : speed,
				});
			},
			/**
			 * 5.9.15 Player.SetSubtitle - Set the subtitle displayed by the player
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.SetSubtitle
			 *
			 * @param {Player.Id} playerid
			 * @param {*} subtitle
			 * @returns {RpcPromise}
			 */
			SetSubtitle : function(playerid, subtitle) {
				return sendCommand('Player.SetSubtitle', {
					"playerid" : playerid,
					"subtitle" : subtitle,
				});
			},
			/**
			 * 5.9.16 Player.Stop - Stops playback
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.Stop
			 *
			 * @param {Player.Id} playerid
			 * @returns {RpcPromise}
			 */
			Stop : function(playerid) {
				return sendCommand('Player.Stop', {
					"playerid" : playerid,
				});
			},
		},
		VideoLibrary : {
			/**
			 * 5.12.4 VideoLibrary.GetEpisodes - Retrieve all tv show episodes
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetEpisodes
			 *
			 * @param {Library.Id=} tvshowid
			 * @param {Number=} season
			 * @param {Array.<Video.Fields.Episode>=} properties
			 * @param {List.Limits=} limits
			 * @param {List.Sort=} sort
			 * @param {*} filter
			 * @returns {RpcPromise}
			 */
			GetEpisodes : function(tvshowid, season, properties, limits, sort, filter) {
				return sendCommand('VideoLibrary.GetEpisodes', {
					"tvshowid"   : tvshowid,
					"season"     : (season === null ? _undef : season),
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
					"filter"     : filter,
				});
			},
			/**
			 * 5.12.9 VideoLibrary.GetMovies - Retrieve all movies
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetMovies
			 *
			 * @param {Array.<Video.Fields.Movie>=} properties
			 * @param {List.Limits=} limits
			 * @param {List.Sort=} sort
			 * @param {*} filter
			 * @return {RpcPromise}
			 */
			GetMovies : function(properties, limits, sort, filter) {
				return sendCommand('VideoLibrary.GetMovies', {
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
					"filter"     : filter,
				});
			},
			/**
			 * 5.12.15 VideoLibrary.GetSeasons
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetSeasons
			 *
			 * @param {Library.Id} tvshowid
			 * @param {Array.<Video.Fields.Season>=} properties
			 * @param {List.Limits=} limits
			 * @param {List.Sort=} sort
			 * @returns {RpcPromise}
			 */
			GetSeasons : function(tvshowid, properties, limits, sort) {
				return sendCommand('VideoLibrary.GetSeasons', {
					"tvshowid"   : tvshowid,
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
				});
			},
			/**
			 * 5.12.17 VideoLibrary.GetTVShows - Retrieve all tv shows
			 * http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#VideoLibrary.GetTVShows
			 *
			 * @param {Array.<Video.Fields.TVShow>=} properties
			 * @param {List.Limits} limits
			 * @param {List.Sort} sort
			 * @param {*} filter
			 * @returns {RpcPromise}
			 */
			GetTVShows : function(properties, limits, sort, filter) {
				return sendCommand('VideoLibrary.GetTVShows', {
					"properties" : properties,
					"limits"     : limits,
					"sort"       : sort,
					"filter"     : filter,
				});
			},
		},
	};

});

'use strict';

define('js/services/types/list.fields.all',[
], function() {
	// http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#List.Fields.All
	return [
		"title",
		"artist",
		"albumartist",
		"genre",
		"year",
		"rating",
		"album",
		"track",
		"duration",
		"comment",
		"lyrics",
		"musicbrainztrackid",
		"musicbrainzartistid",
		"musicbrainzalbumid",
		"musicbrainzalbumartistid",
		"playcount",
		"fanart",
		"director",
		"trailer",
		"tagline",
		"plot",
		"plotoutline",
		"originaltitle",
		"lastplayed",
		"writer",
		"studio",
		"mpaa",
		"cast",
		"country",
		"imdbnumber",
		"premiered",
		"productioncode",
		"runtime",
		"set",
		"showlink",
		"streamdetails",
		"top250",
		"votes",
		"firstaired",
		"season",
		"episode",
		"showtitle",
		"thumbnail",
		"file",
		"resume",
		"artistid",
		"albumid",
		"tvshowid",
		"setid",
		"watchedepisodes",
		"disc",
		"tag",
		"art",
		"genreid",
		"displayartist",
		"albumartistid",
		"description",
		"theme",
		"mood",
		"style",
		"albumlabel",
		"sorttitle",
		"episodeguide",
		"uniqueid",
		"dateadded",
		"channel",
		"channeltype",
		"hidden",
		"locked",
		"channelnumber",
		"starttime",
		"endtime"
	];
})
;
'use strict';

define('js/services/types/player.property.name',[
], function() {
	// http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Player.Property.Name
	return [
		"type",
		"partymode",
		"speed",
		"time",
		"percentage",
		"totaltime",
		"playlistid",
		"position",
		"repeat",
		"shuffled",
		"canseek",
		"canchangespeed",
		"canmove",
		"canzoom",
		"canrotate",
		"canshuffle",
		"canrepeat",
		"currentaudiostream",
		"audiostreams",
		"subtitleenabled",
		"currentsubtitle",
		"subtitles",
		"live"
	];
});

"use strict";

define('js/services/Player',[
	'js/services/XbmcRpc',
	'underscore',
	'js/services/types/list.fields.all',
	'js/services/types/player.property.name',
], function(XbmcRpc, _, LIST_FIELDS_ALL, PLAYER_PROPERTY_NAMES) {
	var activePlayer  = {},
		hasChanged    = false,
		// list of callback functions when player state changes
		__listeners   = [];

	setInterval(updateActivePlayer, 5000);

	function fetchActivePlayer() {
		return XbmcRpc.Player.GetActivePlayers().
			then(function(players) {
				if (players.length > 0) {
					return players[0];
				} else {
					throw new Error("No active players")
				}
			}).
			then(updatePlayerProperties);
	}

	function fetchPlayerProperties(player) {
		return XbmcRpc.Player.GetProperties(player.playerid, PLAYER_PROPERTY_NAMES).
			then(updatePlayerProperties);
	}

	function fetchPlayerCurrentItem(player) {
		return XbmcRpc.Player.GetItem(player.playerid, LIST_FIELDS_ALL).
			then(updateCurrentlyPlaying);
	}

	function updateActivePlayer() {
		return fetchActivePlayer().
			then(fetchPlayerProperties).
			then(fetchPlayerCurrentItem).
			otherwise(deactivatePlayer).
			always(notify);
	};

	function updateCurrentlyPlaying(result) {
		return updatePlayerProperties( { currentitem : result && result.item } );
	}

	function notify() {
		if (hasChanged) {
			_.each(__listeners, function(fn) {
				fn(activePlayer);
			});
			hasChanged = false;
		}
		return activePlayer;
	}

	function updatePlayerProperties(properties) {
		_.each(properties, function(newValue, prop) {
			hasChanged = (hasChanged || !_.isEqual(activePlayer[prop], newValue));
			activePlayer[prop] = newValue;
		});

		return activePlayer;
	}

	function syncProperties(properties) {
		updatePlayerProperties(properties);
		notify();
		return activePlayer;
	}

	function deactivatePlayer() {
		activePlayer = {};
		hasChanged = true;
		return activePlayer;
	}

	function playItem(item) {
		return XbmcRpc.Player.Open( { item : item } ).
			then(updateActivePlayer);
	}

	return {
		update : updateActivePlayer,
		// Player service needs a way to notify interested parties that player state has changed
		notify : function(listener) {
			__listeners.push(listener);
		},
		play : function() {
			if (activePlayer.speed === 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid).then(syncProperties);
			}
		},
		pause : function() {
			if (activePlayer.speed > 0) {
				return XbmcRpc.Player.PlayPause(activePlayer.playerid).then(syncProperties);
			}
		},
		stop : function() {
			return XbmcRpc.Player.Stop(activePlayer.playerid).then(updateActivePlayer);
		},
		togglePlaying : function() {
			return XbmcRpc.Player.PlayPause(activePlayer.playerid).then(syncProperties);
		},
		setSpeed : function(speed) {
			return XbmcRpc.Player.SetSpeed(activePlayer.playerid, speed).then(syncProperties);
		},

		/**
		 * Gets the available subtitles for the active stream
		 * TODO - why is this data not associated with videos?
		 */
		getSubtitles : function() {
			return (activePlayer ? activePlayer.subtitles : []);
		},
		getCurrentSubtitle : function() {
			return (activePlayer && activePlayer.currentsubtitle);
		},
		setSubtitle : function(subtitle) {
			return (subtitle ?
					XbmcRpc.Player.SetSubtitle(activePlayer.playerid, 'on').then(function() {
						return XbmcRpc.Player.SetSubtitle(activePlayer.playerid, subtitle.index);
					}) :
					XbmcRpc.Player.SetSubtitle(activePlayer.playerid, 'off')
				   ).then(updateActivePlayer);
		},
		areSubtitlesEnabled : function() {
			return activePlayer.subtitleenabled;
		},

		/**
		 * Play the specified movie
		 */
		playMovie : function(movie) {
			return playItem({ movieid : movie.movieid });
		},
		/**
		 * Play the specified episode
		 */
		playEpisode : function(episode) {
			return playItem({ episodeid : episode.episodeid });
		},

		isPlaying : function() {
			return activePlayer.speed === 1;
		},
	}
});

"use strict";

define('js/services/Input',
[
	'js/services/XbmcRpc',
],
function(XbmcRpc) {

	var InputService = {};

	var DIRECTION_COMMAND_MAP = {
		"left" : "Left",
		"up"   : "Up",
		"down" : "Down",
		"right" : "Right",
	};

	InputService.move = function(direction) {
		return XbmcRpc.Input[ DIRECTION_COMMAND_MAP[direction] ]();
	};

	InputService.select = function() {
		return XbmcRpc.Input.Select();
	};

	InputService.home = XbmcRpc.Input.Home;
	InputService.back = XbmcRpc.Input.Back;
	InputService.menu = XbmcRpc.Input.ShowOSD;

	return InputService;
});

// lib/handlebars/base.js
(function () {
/*jshint eqnull:true*/
var Handlebars = {};

(function(Handlebars) {

Handlebars.VERSION = "1.0.rc.1";

Handlebars.helpers  = {};
Handlebars.partials = {};

Handlebars.registerHelper = function(name, fn, inverse) {
  if(inverse) { fn.not = inverse; }
  this.helpers[name] = fn;
};

Handlebars.registerPartial = function(name, str) {
  this.partials[name] = str;
};

Handlebars.registerHelper('helperMissing', function(arg) {
  if(arguments.length === 2) {
    return undefined;
  } else {
    throw new Error("Could not find property '" + arg + "'");
  }
});

var toString = Object.prototype.toString, functionType = "[object Function]";

Handlebars.registerHelper('blockHelperMissing', function(context, options) {
  var inverse = options.inverse || function() {}, fn = options.fn;


  var ret = "";
  var type = toString.call(context);

  if(type === functionType) { context = context.call(this); }

  if(context === true) {
    return fn(this);
  } else if(context === false || context == null) {
    return inverse(this);
  } else if(type === "[object Array]") {
    if(context.length > 0) {
      return Handlebars.helpers.each(context, options);
    } else {
      return inverse(this);
    }
  } else {
    return fn(context);
  }
});

Handlebars.K = function() {};

Handlebars.createFrame = Object.create || function(object) {
  Handlebars.K.prototype = object;
  var obj = new Handlebars.K();
  Handlebars.K.prototype = null;
  return obj;
};

Handlebars.registerHelper('each', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  var ret = "", data;

  if (options.data) {
    data = Handlebars.createFrame(options.data);
  }

  if(context && context.length > 0) {
    for(var i=0, j=context.length; i<j; i++) {
      if (data) { data.index = i; }
      ret = ret + fn(context[i], { data: data });
    }
  } else {
    ret = inverse(this);
  }
  return ret;
});

Handlebars.registerHelper('if', function(context, options) {
  var type = toString.call(context);
  if(type === functionType) { context = context.call(this); }

  if(!context || Handlebars.Utils.isEmpty(context)) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

Handlebars.registerHelper('unless', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  options.fn = inverse;
  options.inverse = fn;

  return Handlebars.helpers['if'].call(this, context, options);
});

Handlebars.registerHelper('with', function(context, options) {
  return options.fn(context);
});

Handlebars.registerHelper('log', function(context) {
  Handlebars.log(context);
});

}(Handlebars));
;
// lib/handlebars/utils.js
Handlebars.Exception = function(message) {
  var tmp = Error.prototype.constructor.apply(this, arguments);

  for (var p in tmp) {
    if (tmp.hasOwnProperty(p)) { this[p] = tmp[p]; }
  }

  this.message = tmp.message;
};
Handlebars.Exception.prototype = new Error();

// Build out our basic SafeString type
Handlebars.SafeString = function(string) {
  this.string = string;
};
Handlebars.SafeString.prototype.toString = function() {
  return this.string.toString();
};

(function() {
  var escape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /[&<>"'`]/g;
  var possible = /[&<>"'`]/;

  var escapeChar = function(chr) {
    return escape[chr] || "&amp;";
  };

  Handlebars.Utils = {
    escapeExpression: function(string) {
      // don't escape SafeStrings, since they're already safe
      if (string instanceof Handlebars.SafeString) {
        return string.toString();
      } else if (string == null || string === false) {
        return "";
      }

      if(!possible.test(string)) { return string; }
      return string.replace(badChars, escapeChar);
    },

    isEmpty: function(value) {
      if (typeof value === "undefined") {
        return true;
      } else if (value === null) {
        return true;
      } else if (value === false) {
        return true;
      } else if(Object.prototype.toString.call(value) === "[object Array]" && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }
  };
})();;
// lib/handlebars/compiler/compiler.js

/*jshint eqnull:true*/
Handlebars.Compiler = function() {};
Handlebars.JavaScriptCompiler = function() {};

(function(Compiler, JavaScriptCompiler) {
  // the foundHelper register will disambiguate helper lookup from finding a
  // function in a context. This is necessary for mustache compatibility, which
  // requires that context functions in blocks are evaluated by blockHelperMissing,
  // and then proceed as if the resulting value was provided to blockHelperMissing.

  Compiler.prototype = {
    compiler: Compiler,

    disassemble: function() {
      var opcodes = this.opcodes, opcode, out = [], params, param;

      for (var i=0, l=opcodes.length; i<l; i++) {
        opcode = opcodes[i];

        if (opcode.opcode === 'DECLARE') {
          out.push("DECLARE " + opcode.name + "=" + opcode.value);
        } else {
          params = [];
          for (var j=0; j<opcode.args.length; j++) {
            param = opcode.args[j];
            if (typeof param === "string") {
              param = "\"" + param.replace("\n", "\\n") + "\"";
            }
            params.push(param);
          }
          out.push(opcode.opcode + " " + params.join(" "));
        }
      }

      return out.join("\n");
    },

    guid: 0,

    compile: function(program, options) {
      this.children = [];
      this.depths = {list: []};
      this.options = options;

      // These changes will propagate to the other compiler components
      var knownHelpers = this.options.knownHelpers;
      this.options.knownHelpers = {
        'helperMissing': true,
        'blockHelperMissing': true,
        'each': true,
        'if': true,
        'unless': true,
        'with': true,
        'log': true
      };
      if (knownHelpers) {
        for (var name in knownHelpers) {
          this.options.knownHelpers[name] = knownHelpers[name];
        }
      }

      return this.program(program);
    },

    accept: function(node) {
      return this[node.type](node);
    },

    program: function(program) {
      var statements = program.statements, statement;
      this.opcodes = [];

      for(var i=0, l=statements.length; i<l; i++) {
        statement = statements[i];
        this[statement.type](statement);
      }
      this.isSimple = l === 1;

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++, depth;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache,
          program = block.program,
          inverse = block.inverse;

      if (program) {
        program = this.compileProgram(program);
      }

      if (inverse) {
        inverse = this.compileProgram(inverse);
      }

      var type = this.classifyMustache(mustache);

      if (type === "helper") {
        this.helperMustache(mustache, program, inverse);
      } else if (type === "simple") {
        this.simpleMustache(mustache);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('pushLiteral', '{}');
        this.opcode('blockValue');
      } else {
        this.ambiguousMustache(mustache, program, inverse);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('pushLiteral', '{}');
        this.opcode('ambiguousBlockValue');
      }

      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, pair, val;

      this.opcode('push', '{}');

      for(var i=0, l=pairs.length; i<l; i++) {
        pair = pairs[i];
        val  = pair[1];

        this.accept(val);
        this.opcode('assignToHash', pair[0]);
      }
    },

    partial: function(partial) {
      var id = partial.id;
      this.usePartial = true;

      if(partial.context) {
        this.ID(partial.context);
      } else {
        this.opcode('push', 'depth0');
      }

      this.opcode('invokePartial', id.original);
      this.opcode('append');
    },

    content: function(content) {
      this.opcode('appendContent', content.string);
    },

    mustache: function(mustache) {
      var options = this.options;
      var type = this.classifyMustache(mustache);

      if (type === "simple") {
        this.simpleMustache(mustache);
      } else if (type === "helper") {
        this.helperMustache(mustache);
      } else {
        this.ambiguousMustache(mustache);
      }

      if(mustache.escaped && !options.noEscape) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ambiguousMustache: function(mustache, program, inverse) {
      var id = mustache.id, name = id.parts[0];

      this.opcode('getContext', id.depth);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      this.opcode('invokeAmbiguous', name);
    },

    simpleMustache: function(mustache, program, inverse) {
      var id = mustache.id;

      if (id.type === 'DATA') {
        this.DATA(id);
      } else if (id.parts.length) {
        this.ID(id);
      } else {
        // Simplified ID for `this`
        this.addDepth(id.depth);
        this.opcode('getContext', id.depth);
        this.opcode('pushContext');
      }

      this.opcode('resolvePossibleLambda');
    },

    helperMustache: function(mustache, program, inverse) {
      var params = this.setupFullMustacheParams(mustache, program, inverse),
          name = mustache.id.parts[0];

      if (this.options.knownHelpers[name]) {
        this.opcode('invokeKnownHelper', params.length, name);
      } else if (this.knownHelpersOnly) {
        throw new Error("You specified knownHelpersOnly, but used the unknown helper " + name);
      } else {
        this.opcode('invokeHelper', params.length, name);
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);
      this.opcode('getContext', id.depth);

      var name = id.parts[0];
      if (!name) {
        this.opcode('pushContext');
      } else {
        this.opcode('lookupOnContext', id.parts[0]);
      }

      for(var i=1, l=id.parts.length; i<l; i++) {
        this.opcode('lookup', id.parts[i]);
      }
    },

    DATA: function(data) {
      this.options.data = true;
      this.opcode('lookupData', data.id);
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    INTEGER: function(integer) {
      this.opcode('pushLiteral', integer.integer);
    },

    BOOLEAN: function(bool) {
      this.opcode('pushLiteral', bool.bool);
    },

    comment: function() {},

    // HELPERS
    opcode: function(name) {
      this.opcodes.push({ opcode: name, args: [].slice.call(arguments, 1) });
    },

    declare: function(name, value) {
      this.opcodes.push({ opcode: 'DECLARE', name: name, value: value });
    },

    addDepth: function(depth) {
      if(isNaN(depth)) { throw new Error("EWOT"); }
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    classifyMustache: function(mustache) {
      var isHelper   = mustache.isHelper;
      var isEligible = mustache.eligibleHelper;
      var options    = this.options;

      // if ambiguous, we can possibly resolve the ambiguity now
      if (isEligible && !isHelper) {
        var name = mustache.id.parts[0];

        if (options.knownHelpers[name]) {
          isHelper = true;
        } else if (options.knownHelpersOnly) {
          isEligible = false;
        }
      }

      if (isHelper) { return "helper"; }
      else if (isEligible) { return "ambiguous"; }
      else { return "simple"; }
    },

    pushParams: function(params) {
      var i = params.length, param;

      while(i--) {
        param = params[i];

        if(this.options.stringParams) {
          if(param.depth) {
            this.addDepth(param.depth);
          }

          this.opcode('getContext', param.depth || 0);
          this.opcode('pushStringParam', param.string);
        } else {
          this[param.type](param);
        }
      }
    },

    setupMustacheParams: function(mustache) {
      var params = mustache.params;
      this.pushParams(params);

      if(mustache.hash) {
        this.hash(mustache.hash);
      } else {
        this.opcode('pushLiteral', '{}');
      }

      return params;
    },

    // this will replace setupMustacheParams when we're done
    setupFullMustacheParams: function(mustache, program, inverse) {
      var params = mustache.params;
      this.pushParams(params);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      if(mustache.hash) {
        this.hash(mustache.hash);
      } else {
        this.opcode('pushLiteral', '{}');
      }

      return params;
    }
  };

  var Literal = function(value) {
    this.value = value;
  };

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name, type) {
      if (/^[0-9]+$/.test(name)) {
        return parent + "[" + name + "]";
      } else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
        return parent + "." + name;
      }
      else {
        return parent + "['" + name + "']";
      }
    },

    appendToBuffer: function(string) {
      if (this.environment.isSimple) {
        return "return " + string + ";";
      } else {
        return "buffer += " + string + ";";
      }
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },

    namespace: "Handlebars",
    // END PUBLIC API

    compile: function(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options || {};

      Handlebars.log(Handlebars.logger.DEBUG, this.environment.disassemble() + "\n\n");

      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        programs: [],
        aliases: { }
      };

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];
      this.registers = { list: [] };
      this.compileStack = [];

      this.compileChildren(environment, options);

      var opcodes = environment.opcodes, opcode;

      this.i = 0;

      for(l=opcodes.length; this.i<l; this.i++) {
        opcode = opcodes[this.i];

        if(opcode.opcode === 'DECLARE') {
          this[opcode.name] = opcode.value;
        } else {
          this[opcode.opcode].apply(this, opcode.args);
        }
      }

      return this.createFunctionContext(asObject);
    },

    nextOpcode: function() {
      var opcodes = this.environment.opcodes, opcode = opcodes[this.i + 1];
      return opcodes[this.i + 1];
    },

    eat: function(opcode) {
      this.i = this.i + 1;
    },

    preamble: function() {
      var out = [];

      if (!this.isChild) {
        var namespace = this.namespace;
        var copies = "helpers = helpers || " + namespace + ".helpers;";
        if (this.environment.usePartial) { copies = copies + " partials = partials || " + namespace + ".partials;"; }
        if (this.options.data) { copies = copies + " data = data || {};"; }
        out.push(copies);
      } else {
        out.push('');
      }

      if (!this.environment.isSimple) {
        out.push(", buffer = " + this.initializeBuffer());
      } else {
        out.push("");
      }

      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = out;
    },

    createFunctionContext: function(asObject) {
      var locals = this.stackVars.concat(this.registers.list);

      if(locals.length > 0) {
        this.source[1] = this.source[1] + ", " + locals.join(", ");
      }

      // Generate minimizer alias mappings
      if (!this.isChild) {
        var aliases = [];
        for (var alias in this.context.aliases) {
          this.source[1] = this.source[1] + ', ' + alias + '=' + this.context.aliases[alias];
        }
      }

      if (this.source[1]) {
        this.source[1] = "var " + this.source[1].substring(2) + ";";
      }

      // Merge children
      if (!this.isChild) {
        this.source[1] += '\n' + this.context.programs.join('\n') + '\n';
      }

      if (!this.environment.isSimple) {
        this.source.push("return buffer;");
      }

      var params = this.isChild ? ["depth0", "data"] : ["Handlebars", "depth0", "helpers", "partials", "data"];

      for(var i=0, l=this.environment.depths.list.length; i<l; i++) {
        params.push("depth" + this.environment.depths.list[i]);
      }

      if (asObject) {
        params.push(this.source.join("\n  "));

        return Function.apply(this, params);
      } else {
        var functionSource = 'function ' + (this.name || '') + '(' + params.join(',') + ') {\n  ' + this.source.join("\n  ") + '}';
        Handlebars.log(Handlebars.logger.DEBUG, functionSource + "\n\n");
        return functionSource;
      }
    },

    // [blockValue]
    //
    // On stack, before: hash, inverse, program, value
    // On stack, after: return value of blockHelperMissing
    //
    // The purpose of this opcode is to take a block of the form
    // `{{#foo}}...{{/foo}}`, resolve the value of `foo`, and
    // replace it on the stack with the result of properly
    // invoking blockHelperMissing.
    blockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      this.replaceStack(function(current) {
        params.splice(1, 0, current);
        return current + " = blockHelperMissing.call(" + params.join(", ") + ")";
      });
    },

    // [ambiguousBlockValue]
    //
    // On stack, before: hash, inverse, program, value
    // Compiler value, before: lastHelper=value of last found helper, if any
    // On stack, after, if no lastHelper: same as [blockValue]
    // On stack, after, if lastHelper: value
    ambiguousBlockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      var current = this.topStack();
      params.splice(1, 0, current);

      this.source.push("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
    },

    // [appendContent]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Appends the string value of `content` to the current buffer
    appendContent: function(content) {
      this.source.push(this.appendToBuffer(this.quotedString(content)));
    },

    // [append]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Coerces `value` to a String and appends it to the current buffer.
    //
    // If `value` is truthy, or 0, it is coerced into a string and appended
    // Otherwise, the empty string is appended
    append: function() {
      var local = this.popStack();
      this.source.push("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
      if (this.environment.isSimple) {
        this.source.push("else { " + this.appendToBuffer("''") + " }");
      }
    },

    // [appendEscaped]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Escape `value` and append it to the buffer
    appendEscaped: function() {
      var opcode = this.nextOpcode(), extra = "";
      this.context.aliases.escapeExpression = 'this.escapeExpression';

      if(opcode && opcode.opcode === 'appendContent') {
        extra = " + " + this.quotedString(opcode.args[0]);
        this.eat(opcode);
      }

      this.source.push(this.appendToBuffer("escapeExpression(" + this.popStack() + ")" + extra));
    },

    // [getContext]
    //
    // On stack, before: ...
    // On stack, after: ...
    // Compiler value, after: lastContext=depth
    //
    // Set the value of the `lastContext` compiler value to the depth
    getContext: function(depth) {
      if(this.lastContext !== depth) {
        this.lastContext = depth;
      }
    },

    // [lookupOnContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext[name], ...
    //
    // Looks up the value of `name` on the current context and pushes
    // it onto the stack.
    lookupOnContext: function(name) {
      this.pushStack(this.nameLookup('depth' + this.lastContext, name, 'context'));
    },

    // [pushContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext, ...
    //
    // Pushes the value of the current context onto the stack.
    pushContext: function() {
      this.pushStackLiteral('depth' + this.lastContext);
    },

    // [resolvePossibleLambda]
    //
    // On stack, before: value, ...
    // On stack, after: resolved value, ...
    //
    // If the `value` is a lambda, replace it on the stack by
    // the return value of the lambda
    resolvePossibleLambda: function() {
      this.context.aliases.functionType = '"function"';

      this.replaceStack(function(current) {
        return "typeof " + current + " === functionType ? " + current + "() : " + current;
      });
    },

    // [lookup]
    //
    // On stack, before: value, ...
    // On stack, after: value[name], ...
    //
    // Replace the value on the stack with the result of looking
    // up `name` on `value`
    lookup: function(name) {
      this.replaceStack(function(current) {
        return current + " == null || " + current + " === false ? " + current + " : " + this.nameLookup(current, name, 'context');
      });
    },

    // [lookupData]
    //
    // On stack, before: ...
    // On stack, after: data[id], ...
    //
    // Push the result of looking up `id` on the current data
    lookupData: function(id) {
      this.pushStack(this.nameLookup('data', id, 'data'));
    },

    // [pushStringParam]
    //
    // On stack, before: ...
    // On stack, after: string, currentContext, ...
    //
    // This opcode is designed for use in string mode, which
    // provides the string value of a parameter along with its
    // depth rather than resolving it immediately.
    pushStringParam: function(string) {
      this.pushStackLiteral('depth' + this.lastContext);
      this.pushString(string);
    },

    // [pushString]
    //
    // On stack, before: ...
    // On stack, after: quotedString(string), ...
    //
    // Push a quoted version of `string` onto the stack
    pushString: function(string) {
      this.pushStackLiteral(this.quotedString(string));
    },

    // [push]
    //
    // On stack, before: ...
    // On stack, after: expr, ...
    //
    // Push an expression onto the stack
    push: function(expr) {
      this.pushStack(expr);
    },

    // [pushLiteral]
    //
    // On stack, before: ...
    // On stack, after: value, ...
    //
    // Pushes a value onto the stack. This operation prevents
    // the compiler from creating a temporary variable to hold
    // it.
    pushLiteral: function(value) {
      this.pushStackLiteral(value);
    },

    // [pushProgram]
    //
    // On stack, before: ...
    // On stack, after: program(guid), ...
    //
    // Push a program expression onto the stack. This takes
    // a compile-time guid and converts it into a runtime-accessible
    // expression.
    pushProgram: function(guid) {
      if (guid != null) {
        this.pushStackLiteral(this.programExpression(guid));
      } else {
        this.pushStackLiteral(null);
      }
    },

    // [invokeHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // Pops off the helper's parameters, invokes the helper,
    // and pushes the helper's return value onto the stack.
    //
    // If the helper is not found, `helperMissing` is called.
    invokeHelper: function(paramSize, name) {
      this.context.aliases.helperMissing = 'helpers.helperMissing';

      var helper = this.lastHelper = this.setupHelper(paramSize, name);
      this.register('foundHelper', helper.name);

      this.pushStack("foundHelper ? foundHelper.call(" +
        helper.callParams + ") " + ": helperMissing.call(" +
        helper.helperMissingParams + ")");
    },

    // [invokeKnownHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // This operation is used when the helper is known to exist,
    // so a `helperMissing` fallback is not required.
    invokeKnownHelper: function(paramSize, name) {
      var helper = this.setupHelper(paramSize, name);
      this.pushStack(helper.name + ".call(" + helper.callParams + ")");
    },

    // [invokeAmbiguous]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of disambiguation
    //
    // This operation is used when an expression like `{{foo}}`
    // is provided, but we don't know at compile-time whether it
    // is a helper or a path.
    //
    // This operation emits more code than the other options,
    // and can be avoided by passing the `knownHelpers` and
    // `knownHelpersOnly` flags at compile-time.
    invokeAmbiguous: function(name) {
      this.context.aliases.functionType = '"function"';

      this.pushStackLiteral('{}');
      var helper = this.setupHelper(0, name);

      var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');
      this.register('foundHelper', helperName);

      var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');
      var nextStack = this.nextStack();

      this.source.push('if (foundHelper) { ' + nextStack + ' = foundHelper.call(' + helper.callParams + '); }');
      this.source.push('else { ' + nextStack + ' = ' + nonHelper + '; ' + nextStack + ' = typeof ' + nextStack + ' === functionType ? ' + nextStack + '() : ' + nextStack + '; }');
    },

    // [invokePartial]
    //
    // On stack, before: context, ...
    // On stack after: result of partial invocation
    //
    // This operation pops off a context, invokes a partial with that context,
    // and pushes the result of the invocation back.
    invokePartial: function(name) {
      var params = [this.nameLookup('partials', name, 'partial'), "'" + name + "'", this.popStack(), "helpers", "partials"];

      if (this.options.data) {
        params.push("data");
      }

      this.context.aliases.self = "this";
      this.pushStack("self.invokePartial(" + params.join(", ") + ");");
    },

    // [assignToHash]
    //
    // On stack, before: value, hash, ...
    // On stack, after: hash, ...
    //
    // Pops a value and hash off the stack, assigns `hash[key] = value`
    // and pushes the hash back onto the stack.
    assignToHash: function(key) {
      var value = this.popStack();
      var hash = this.topStack();

      this.source.push(hash + "['" + key + "'] = " + value + ";");
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
        var index = this.context.programs.length;
        child.index = index;
        child.name = 'program' + index;
        this.context.programs[index] = compiler.compile(child, options, this.context);
      }
    },

    programExpression: function(guid) {
      this.context.aliases.self = "this";

      if(guid == null) {
        return "self.noop";
      }

      var child = this.environment.children[guid],
          depths = child.depths.list, depth;

      var programParams = [child.index, child.name, "data"];

      for(var i=0, l = depths.length; i<l; i++) {
        depth = depths[i];

        if(depth === 1) { programParams.push("depth0"); }
        else { programParams.push("depth" + (depth - 1)); }
      }

      if(depths.length === 0) {
        return "self.program(" + programParams.join(", ") + ")";
      } else {
        programParams.shift();
        return "self.programWithDepth(" + programParams.join(", ") + ")";
      }
    },

    register: function(name, val) {
      this.useRegister(name);
      this.source.push(name + " = " + val + ";");
    },

    useRegister: function(name) {
      if(!this.registers[name]) {
        this.registers[name] = true;
        this.registers.list.push(name);
      }
    },

    pushStackLiteral: function(item) {
      this.compileStack.push(new Literal(item));
      return item;
    },

    pushStack: function(item) {
      this.source.push(this.incrStack() + " = " + item + ";");
      this.compileStack.push("stack" + this.stackSlot);
      return "stack" + this.stackSlot;
    },

    replaceStack: function(callback) {
      var item = callback.call(this, this.topStack());

      this.source.push(this.topStack() + " = " + item + ";");
      return "stack" + this.stackSlot;
    },

    nextStack: function(skipCompileStack) {
      var name = this.incrStack();
      this.compileStack.push("stack" + this.stackSlot);
      return name;
    },

    incrStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return "stack" + this.stackSlot;
    },

    popStack: function() {
      var item = this.compileStack.pop();

      if (item instanceof Literal) {
        return item.value;
      } else {
        this.stackSlot--;
        return item;
      }
    },

    topStack: function() {
      var item = this.compileStack[this.compileStack.length - 1];

      if (item instanceof Literal) {
        return item.value;
      } else {
        return item;
      }
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r') + '"';
    },

    setupHelper: function(paramSize, name) {
      var params = [];
      this.setupParams(paramSize, params);
      var foundHelper = this.nameLookup('helpers', name, 'helper');

      return {
        params: params,
        name: foundHelper,
        callParams: ["depth0"].concat(params).join(", "),
        helperMissingParams: ["depth0", this.quotedString(name)].concat(params).join(", ")
      };
    },

    // the params and contexts arguments are passed in arrays
    // to fill in
    setupParams: function(paramSize, params) {
      var options = [], contexts = [], param, inverse, program;

      options.push("hash:" + this.popStack());

      inverse = this.popStack();
      program = this.popStack();

      // Avoid setting fn and inverse if neither are set. This allows
      // helpers to do a check for `if (options.fn)`
      if (program || inverse) {
        if (!program) {
          this.context.aliases.self = "this";
          program = "self.noop";
        }

        if (!inverse) {
         this.context.aliases.self = "this";
          inverse = "self.noop";
        }

        options.push("inverse:" + inverse);
        options.push("fn:" + program);
      }

      for(var i=0; i<paramSize; i++) {
        param = this.popStack();
        params.push(param);

        if(this.options.stringParams) {
          contexts.push(this.popStack());
        }
      }

      if (this.options.stringParams) {
        options.push("contexts:[" + contexts.join(",") + "]");
      }

      if(this.options.data) {
        options.push("data:data");
      }

      params.push("{" + options.join(",") + "}");
      return params.join(", ");
    }
  };

  var reservedWords = (
    "break else new var" +
    " case finally return void" +
    " catch for switch while" +
    " continue function this with" +
    " default if throw" +
    " delete in try" +
    " do instanceof typeof" +
    " abstract enum int short" +
    " boolean export interface static" +
    " byte extends long super" +
    " char final native synchronized" +
    " class float package throws" +
    " const goto private transient" +
    " debugger implements protected volatile" +
    " double import public let yield"
  ).split(" ");

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

  JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
    if(!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]+$/.test(name)) {
      return true;
    }
    return false;
  };

})(Handlebars.Compiler, Handlebars.JavaScriptCompiler);

;
// lib/handlebars/runtime.js
Handlebars.VM = {
  template: function(templateSpec) {
    // Just add water
    var container = {
      escapeExpression: Handlebars.Utils.escapeExpression,
      invokePartial: Handlebars.VM.invokePartial,
      programs: [],
      program: function(i, fn, data) {
        var programWrapper = this.programs[i];
        if(data) {
          return Handlebars.VM.program(fn, data);
        } else if(programWrapper) {
          return programWrapper;
        } else {
          programWrapper = this.programs[i] = Handlebars.VM.program(fn);
          return programWrapper;
        }
      },
      programWithDepth: Handlebars.VM.programWithDepth,
      noop: Handlebars.VM.noop
    };

    return function(context, options) {
      options = options || {};
      return templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);
    };
  },

  programWithDepth: function(fn, data, $depth) {
    var args = Array.prototype.slice.call(arguments, 2);

    return function(context, options) {
      options = options || {};

      return fn.apply(this, [context, options.data || data].concat(args));
    };
  },
  program: function(fn, data) {
    return function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
  },
  noop: function() { return ""; },
  invokePartial: function(partial, name, context, helpers, partials, data) {
    var options = { helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Handlebars.Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    } else if (!Handlebars.compile) {
      throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    } else {
      partials[name] = Handlebars.compile(partial, {data: data !== undefined});
      return partials[name](context, options);
    }
  }
};

Handlebars.template = Handlebars.VM.template;
;

// AMD Define
define('handlebars',[],function(){
    return Handlebars;
});

})();

;
;
/**
 * @license handlebars hbs 0.4.0 - Alex Sexton, but Handlebars has it's own licensing junk
 *
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/require-cs for details on the plugin this was based off of
 */

/* Yes, deliciously evil. */
/*jslint evil: true, strict: false, plusplus: false, regexp: false */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
define: false, process: false, window: false */
define('hbs',[
], function (
) {

      return {

        get: function () {
            return Handlebars;
        },

        write: function (pluginName, name, write) {

            if ( (name + customNameExtension ) in buildMap) {
                var text = buildMap[name + customNameExtension];
                write.asModule(pluginName + "!" + name, text);
            }
        },

        version: '0.4.0',

        load: function (name, parentRequire, load, config) {
                  }
      };
});
/* END_hbs_PLUGIN */
;
/* START_TEMPLATE */
define('hbs!views/subtitles',['hbs','handlebars'], function( hbs, Handlebars ){ 
var t = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n		<button class=\"button\" data-index=\"";
  foundHelper = helpers.index;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.index; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.language;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.language; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</button>\n	";
  return buffer;}

  buffer += "<fieldset class=\"subtitles\">\n	<legend>Subtitles</legend>\n	<button class=\"button\" data-index=\"null\">None</button>\n	";
  stack1 = depth0.subtitles;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</fieldset>\n";
  return buffer;});
Handlebars.registerPartial('views_subtitles', t);
return t;
});
/* END_TEMPLATE */
;
'use strict';

define('js/components/remote',[
	'components/flight/lib/component',
	'js/services/Player',
	'js/services/Input',
	'underscore',
	'js/utility/features',
	'hbs!views/subtitles',
], function(defineComponent, Player, Input, _, features, subtitleTemplate) {

	var DRAG_THRESHOLD = 50;
	var REGEX_ARROW_DIRECTION = /(up|down|left|right)/;

	return defineComponent(remote);

	function remote() {

		this.defaultAttrs({
			"selectorRemote" : ".button.remote",
			"selectorLibrary" : ".button.library",
			"selectorRewind" : ".rewind",
			"selectorPlayPause" : ".play-pause",
			"selectorFastForward" : ".forward",
			"selectorStop" : ".stop",
			"selectorGrip" : "#grippy-grip",
			"selectorArrowUp" : "#remote-navigation .arrow.up",
			"selectorArrowDown" : "#remote-navigation .arrow.down",
			"selectorArrowLeft" : "#remote-navigation .arrow.left",
			"selectorArrowRight" : "#remote-navigation .arrow.right",
			"selectorGuiSelect" : "#remote-navigation .enter",
			"selectorSubtitles" : "#playback-subtitles",
			"selectorSubtitleButton" : "#playback-subtitles button",
			"selectorMenuButton" : "button.menu",
			"selectorHomeButton" : "button.home",
			"selectorBackButton" : "button.back",
		});

		this.rewind = function() {
			Player.setSpeed('decrement');
		};

		this.togglePlayPause = function() {
			Player.togglePlaying();
		};

		this.fastForward = function() {
			Player.setSpeed('increment');
		};

		this.showRemote = function() {
			this.$node.css('height', '100%');
		};

		this.showLibrary = function() {
			this.$node.css('height', '');
		};

		this.stop = Player.stop;

		this.move = function(event) {
			Input.move( REGEX_ARROW_DIRECTION.exec($(event.target).attr('class'))[1] );
		};

		this.guiSelect = Input.select;

		this.updateControl = function(event, speed) {
			this.select('selectorPlayPause').
				toggleClass('icon-play', speed !== 1).
				toggleClass('icon-pause', speed === 1);
		}

		this.updateSubtitles = function(event, subtitles) {
			var currentSubtitle = (Player.areSubtitlesEnabled() ? Player.getCurrentSubtitle().index : null);
			if (!_.isEqual(this.select('selectorSubtitles').data('source'), subtitles)) {
				this.select('selectorSubtitles').
					data('source', subtitles).
					html( subtitleTemplate({
						currentSubtitle : currentSubtitle,
						subtitles : subtitles
					}) );
			}
			this.select('selectorSubtitleButton').removeClass('active').
				filter('[data-index=' + currentSubtitle + ']').addClass('active');
		};

		this.activateSubtitle = function(event) {
			var $target = $(event.target),
				index   = $target.attr('data-index');

			if ($target.hasClass('active')) {
				// do nothing if it's already active
				return;
			}
			Player.setSubtitle(
				index === 'null' ? null :
				_.findWhere(
					this.select('selectorSubtitles').data('source'),
					{ index : parseInt(index, 10) }
				)
			);
		};

		this.startDrag = function(event) {
			event.preventDefault();
			event.stopPropagation();
			if (!is_dragging(this)) {
				this.$node.
					addClass('dragging').
					data({
						'lastPosition' : get_y(event),
						'startPosition' : get_y(event),
					});

				this.on(document, 'mousemove', this.drag);
				this.on(document, 'touchmove', this.drag);
				this.on(document, 'mouseup', this.stopDrag);
				this.on(document, 'touchend', this.stopDrag);
			}
		};
		this.stopDrag = function(event) {
			event.preventDefault();
			event.stopPropagation();
			if (is_dragging(this)) {
				this.off(document, 'mousemove', this.drag);
				this.off(document, 'touchmove', this.drag);
				this.off(document, 'mouseup', this.stopDrag);
				this.off(document, 'touchend', this.stopDrag);
				this.$node.
					removeClass('dragging').
					css('height', this.$node.data('lastPosition') - this.$node.data('startPosition') > DRAG_THRESHOLD ? window.innerHeight : '');
			}
		};
		this.drag = function(event) {
			event.preventDefault();
			event.stopPropagation();

			// if this would cause the remote height to drop below the minimum, ignore it
			var newHeight = this.$node.height() + get_y(event) - this.$node.data('lastPosition');
			if (newHeight > min_settable_height(this.$node)) {
				this.$node.
					height( newHeight ).
					data('lastPosition', get_y(event));
			}
		};

		this.after('initialize', function() {
			this.on('click', {
				"selectorRemote" : this.showRemote,
				"selectorLibrary" : this.showLibrary,
				"selectorRewind" : this.rewind,
				"selectorPlayPause" : this.togglePlayPause,
				"selectorFastForward" : this.fastForward,
				"selectorStop" : this.stop,
				"selectorArrowUp" : this.move,
				"selectorArrowDown" : this.move,
				"selectorArrowLeft" : this.move,
				"selectorArrowRight" : this.move,
				"selectorGuiSelect" : this.guiSelect,
				"selectorSubtitleButton" : this.activateSubtitle,
				"selectorMenuButton" : Input.menu,
				"selectorHomeButton" : Input.home,
				"selectorBackButton" : Input.back,
			});

			this.on(document, 'playerSpeedChanged', this.updateControl);
			this.on(document, 'playerSubtitlesChanged', this.updateSubtitles);

			if (features.touch) {
				this.on('mousedown', {
					"selectorGrip" : this.startDrag,
				});
				this.on('touchstart', {
					"selectorGrip" : this.startDrag,
				});
			}
		});
	}

	function get_y(event) {
		return (event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.pageY);
	}
	function is_dragging(component) {
		return component.$node.hasClass('dragging');
	}
	function min_settable_height($node) {
		return _.reduce(['borderTopWidth', 'paddingTop', 'paddingBottom', 'borderBottomWidth'], function(memo, prop) {
			return memo - parseFloat($node.css(prop));
		}, parseFloat($node.css('minHeight')));
	}
});

'use strict';

define('js/filters/lpad',
[
	'handlebars',
],
function(Handlebars) {

	function lpad(number, length) {
		while((''+number).length < length && (number = '0' + number));

		return number;
	}

	Handlebars.registerHelper( 'lpad', lpad );

	return lpad;
});

'use strict';

define('js/filters/formatTime',
[
	'handlebars',
	'js/filters/lpad',
],
function(Handlebars, lpad) {

	function formatTime(time) {
		var str = [];
		if (time.hours) {
			str.push(time.hours);
		}
		str.push( lpad(time.minutes, 2) );
		str.push( lpad(time.seconds, 2) );

		return str.join(':');
	};

	Handlebars.registerHelper( 'formatTime', formatTime );

	return formatTime;
});

'use strict';

define('js/filters/slug',
[
	'handlebars',
],
function(Handlebars) {

	function slug(str) {
		return str.
			// lower case
			toLowerCase().
			// yank years
			replace(/\[\d{4}\]/, '').
			replace(/\(\d{4}\)/, '').
			// turn everything *not* a letter or number into a dash
			replace(/[^a-z0-9]+/g, '-').
			// trim leading/trailing dashes
			replace(/^-+|-+$/g, '');
	};

	Handlebars.registerHelper( 'slug', slug );

	return slug;
});

'use strict';

define('js/utility/video_type',
[
], function() {
	return function(videoItem) {
		// XBMC does not have 'movieid' as a valid return field in Player.GetItem
		// Determine the type, the hard way
		return (
			videoItem.hasOwnProperty('type') ? videoItem.type :
			videoItem.hasOwnProperty('movieid') ? 'movie' :
			videoItem.hasOwnProperty('tvshowid') && videoItem.tvshowid > 0 ? 'episode' :
			null
		);
	};
});

'use strict';

define('js/filters/itemLink',
[
	'handlebars',
	'js/filters/slug',
	'js/filters/lpad',
	'js/utility/video_type',
],
function(Handlebars, slug, lpad, videoType) {

	function itemLink(videoItem) {
		switch(videoType(videoItem)) {
			case 'movie' :
				return '#/movies/' + slug(videoItem.title);
			case 'episode' :
				return '#/tv-shows/' + slug(videoItem.showtitle) + '/S' + lpad(videoItem.season, 2) + 'E' + lpad(videoItem.episode, 2) + '/' + slug(videoItem.title);
			default :
				return '#/UNKNOWN_TYPE';
		}
	};

	Handlebars.registerHelper( 'itemLink', itemLink );

	return itemLink;
});

'use strict';

define('js/components/now-playing',[
	'components/flight/lib/component',
	'js/services/Player',
	'js/filters/formatTime',
	'js/filters/itemLink',
	'js/filters/lpad',
	'js/utility/video_type',
], function(defineComponent, Player, formatTime, itemLink, lpad, videoType) {

	return defineComponent(nowPlaying);

	function nowPlaying() {

		this.defaultAttrs({
			"selectorStatus" : ".status",
			"selectorTitle"  : ".current-item",
			"selectorPlayTime"    : ".playtime",
			"selectorElapsedTime" : ".elapsed",
			"selectorTotalTime"   : ".total",
		});

		function processPlayerStateChanged(playerState) {
			this.trigger(playerState.currentitem ? 'show' : 'hide');

			this.select('selectorStatus').
				toggleClass('icon-play', playerState.speed !== 1).
				toggleClass('icon-pause', playerState.speed === 1);

			this.select('selectorTitle').
				attr('href', playerState.currentitem ? itemLink(playerState.currentitem) : 'javascript:void(0)').
				html( playerState.currentitem ? format_video_name(playerState.currentitem) : 'None' );

			this.updatePlayTime(playerState);

			// trigger some specific global events
			$(document).trigger('playerSpeedChanged', playerState.speed);
			$(document).trigger('playerSubtitlesChanged', [playerState.subtitles]);
		}

		this.updatePlayTime = function(playerState) {
			if (playerState.time && playerState.totaltime) {
				this.select('selectorElapsedTime').html( formatTime(playerState.time) );
				this.select('selectorTotalTime').html( formatTime(playerState.totaltime) );
				this.select('selectorPlayTime').show();
			} else {
				this.select('selectorPlayTime').hide();
			}
		}

		this.show = function() {
			this.$node.addClass('active');
		};

		this.hide = function() {
			this.$node.removeClass('active');
		};

		this.after('initialize', function() {
			var updateComponent = _.bind(processPlayerStateChanged, this);
			Player.notify(updateComponent);
			Player.update().then(updateComponent);

			this.on('show', this.show);
			this.on('hide', this.hide);
		});
	}

	function format_video_name(videoFile) {
		switch(videoType(videoFile)) {
			case 'movie' :
				return videoFile.title;
			case 'episode' :
				return videoFile.showtitle + ' S' + lpad(videoFile.season, 2) + 'E' + lpad(videoFile.episode, 2) + ': ' + videoFile.title;
			default :
				return '(unknown file type)';
		}
	}
});

'use strict';

define('js/services/types/video.fields.movie',[
], function() {
	// http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Video.Fields.Movie
	return [
		"title",
		"genre",
		"year",
		"rating",
		"director",
		"trailer",
		"tagline",
		"plot",
		"plotoutline",
		"originaltitle",
		"lastplayed",
		"playcount",
		"writer",
		"studio",
		"mpaa",
		"cast",
		"country",
		"imdbnumber",
		"runtime",
		"set",
		"showlink",
		"streamdetails",
		"top250",
		"votes",
		"fanart",
		"thumbnail",
		"file",
		"sorttitle",
		"resume",
		"setid",
		"dateadded",
		"tag",
		"art"
	];
})
;
'use strict';

define('js/services/types/video.fields.tvshow',[
], function() {
	// http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Video.Fields.TVShow
	return [
		"title",
		"genre",
		"year",
		"rating",
		"plot",
		"studio",
		"mpaa",
		"cast",
		"playcount",
		"episode",
		"imdbnumber",
		"premiered",
		"votes",
		"lastplayed",
		"fanart",
		"thumbnail",
		"file",
		"originaltitle",
		"sorttitle",
		"episodeguide",
		"season",
		"watchedepisodes",
		"dateadded",
		"tag",
		"art"
	];
})
;
'use strict';

define('js/services/types/video.fields.season',[
], function() {
	return [
		"season",
		"showtitle",
		"playcount",
		"episode",
		"fanart",
		"thumbnail",
		"tvshowid",
		"watchedepisodes",
		"art"
	];
});

'use strict';

define('js/services/types/video.fields.episode',[
], function() {
	// http://wiki.xbmc.org/index.php?title=JSON-RPC_API/v6#Video.Fields.Episode
	return [
		"title",
		"plot",
		"votes",
		"rating",
		"writer",
		"firstaired",
		"playcount",
		"runtime",
		"director",
		"productioncode",
		"season",
		"episode",
		"originaltitle",
		"showtitle",
		"cast",
		"streamdetails",
		"lastplayed",
		"fanart",
		"thumbnail",
		"file",
		"resume",
		"tvshowid",
		"dateadded",
		"uniqueid",
		"art"
	];
});

"use strict";

define('js/services/VideoLibrary',
[
	'js/services/XbmcRpc',
	'js/filters/slug',
	'js/services/types/video.fields.movie',
	'js/services/types/video.fields.tvshow',
	'js/services/types/video.fields.season',
	'js/services/types/video.fields.episode',
],
function(XbmcRpc, slugFilter, VIDEO_FIELDS_MOVIE, VIDEO_FIELDS_TVSHOW, VIDEO_FIELDS_SEASON, VIDEO_FIELDS_EPISODE) {
	var VideoLibraryService = {},
		// internal cache variables
		movies, tvshows, seasons, episodes;

	VideoLibraryService.clearCache = function() {
		movies   = null;
		tvshows  = null;
		seasons  = {};
		episodes = {};
	};

	VideoLibraryService.getMovies = function() {
		// cache the movies
		if (!movies) {
			movies = XbmcRpc.VideoLibrary.GetMovies(VIDEO_FIELDS_MOVIE).then(function(results) {
				return results.movies;
			});
		}
		return movies;
	};

	VideoLibraryService.getMovieFromSlug = function(movieSlug) {
		return VideoLibraryService.getMovies().
			then(function(movies) {
				for (var i = 0; i < movies.length ; i++) {
					if (movieSlug === slugFilter(movies[i].title)) {
						return movies[i]
					}
				}
				throw "Could not find movie matching slug [ " + movieSlug + " ]";
			});
	}

	VideoLibraryService.getShows = function() {
		if (!tvshows) {
			tvshows = XbmcRpc.VideoLibrary.GetTVShows(VIDEO_FIELDS_TVSHOW).then(function(results) {
				return results.tvshows;
			});
		}
		return tvshows;
	};

	VideoLibraryService.getShowSeasons = function(tv_show) {
		if (!seasons[tv_show.tvshowid]) {
			seasons[tv_show.tvshowid] = XbmcRpc.VideoLibrary.GetSeasons(tv_show.tvshowid, VIDEO_FIELDS_SEASON).then(function(results) {
				return results.seasons;
			});
		}
		return seasons[tv_show.tvshowid];
	};

	VideoLibraryService.getShowFromSlug = function(showSlug) {
		return VideoLibraryService.getShows().then(function(shows) {
			for (var i = 0 ; i < shows.length ; i++) {
				if (showSlug === slugFilter(shows[i].title)) {
					return shows[i];
				}
			}
			throw "Could not find TV show matching slug [ " + showSlug + " ]";
		});
	};

	VideoLibraryService.getEpisodes = function(tv_show) {
		if (!episodes[tv_show.tvshowid]) {
			episodes[tv_show.tvshowid] = XbmcRpc.VideoLibrary.GetEpisodes(tv_show.tvshowid, null, VIDEO_FIELDS_EPISODE).then(function(results) {
				return results.episodes;
			});
		}
		return episodes[tv_show.tvshowid];
	};

	VideoLibraryService.getEpisodeBySeasonEpisode = function(show, season, episode) {
		return VideoLibraryService.getEpisodes(show).then(function(episodeList) {
			for(var i = 0 ; i < episodeList.length ; i++) {
				if (episodeList[i].season === season && episodeList[i].episode === episode) {
					return episodeList[i];
				}
			}
			throw "Could not find episode S" + season + "E" + episode + " of " + show.title;
		});
	}

	// Initialize the cache
	VideoLibraryService.clearCache();

	return VideoLibraryService;

});

'use strict';

define('js/mixins/main-view',[
], function() {

	var EVENT_MAIN_VIEW_HIDE_OTHERS = 'mainView:hideOthers';

	return mainView;

	/**
	 * Generalized mixin for handling the swap between primary
	 * page view components
	 *
	 * Requires:
	 * @param {Function} show A function to manage showing the element
	 * @param {Function} hide A function to manage hiding the element
	 * 
	 * Exports:
	 * {Function(node?, string)} Register an event as activating this primary view component
	 */
	function mainView() {

		/**
		 * Deferral functions for triggering events
		 * @private
		 */
		function triggerShow(data) { this.trigger('show', data); };
		function triggerHide() { this.trigger('hide'); };

		/**
		 * Show/hide functions
		 * @private
		 */
		function show() { this.$node.show(); };
		function hide() { this.$node.hide(); };

		/**
		 * Switch the active view to the given component
		 * @private
		 */
		function switchActiveView(event, data) {
			// temporarily ignore calls to hide other main view components
			this.off(document, EVENT_MAIN_VIEW_HIDE_OTHERS, triggerHide);
			this.trigger(document, EVENT_MAIN_VIEW_HIDE_OTHERS);
			this.on(document, EVENT_MAIN_VIEW_HIDE_OTHERS, triggerHide);
			triggerShow.call(this, data);
		};

		/**
		 * Register a component as a primary view component that activates
		 * on a specific event. Handles internal management of hiding other
		 * primary view components.
		 *
		 * @param {HTMLElement=} elem Element source for the event. Default to this.$node
		 * @param {String} eventName The event name[s] to listen for
		 */
		this.activateOn = function(elem, eventName) {
			if (arguments.length === 1) {
				eventName = elem;
				elem = this.$node;
			}
			this.on(elem, eventName, switchActiveView);
		};

		/**
		 * Register the hide event for this component
		 */
		this.after('initialize', function() {
			this.on(document, EVENT_MAIN_VIEW_HIDE_OTHERS, triggerHide);
			this.on('show', show);
			this.on('hide', hide);
		});
	}

});

'use strict';

define('js/spinner',[
], function() {
	var spinner = $('#spinner'),
		count = 0,
		api = {};

	api.show = function(promise) {
		count++;
		spinner.show();
		return promise.always(api.hide);
	};

	api.hide = function(v) {
		if (--count === 0) {
			spinner.hide();
		}
		return v;
	};

	return api;
});

'use strict';

define('js/mixins/promiseContent',
[
	'js/spinner',
], function(spinner) {

	var EVENT_CONTENT_CHANGED = 'change.content';

	return promiseContent;

	/**
	 * Manages setting promise content into the correct node
	 */
	function promiseContent() {

		/**
		 * Sets the content of the given selector or node
		 * to the return value of the template applied
		 * against the return value of the promise
		 *
		 * @param {String|HTMLElement=} selector The node to replace the contents of; defaults to this.$node
		 * @param {Function(Object)} template The template function to use
		 * @param {Promise} promise The promise that will return the correct data for the template
		 * @return {Promise(HTMLElement, Object)} A promise for a node (or node set) with populated content
		 *											and the data used to generate the content
		 */
		this.setContent = function(selector, template, promise) {
			// get the correct node
			var node;
			if (arguments.length === 2) {
				// omit the first element - shift the args and use the default
				promise  = template;
				template = selector;
				node     = this.$node;
			} else {
				node     = (typeof selector === 'string' ? this.select(selector) : selector);
			}

			// blank the content
			node.empty();

			return spinner.show(
				promise.then(function(templateData) {
					node.html( template(templateData) ).trigger(EVENT_CONTENT_CHANGED, templateData);
					// return the appropriate data
					return templateData;
				})
			);
		};

		/**
		 * Yields a promise for elements matching the selector after a given
		 * promise is fulfilled.
		 *
		 * @param {String} selector The selector attribute of the component
		 * @param {Promise} promise The promise to chain the selection to
		 * @return {Promise(HTMLElement, Object)} A promise for the selected elements and
		 *                                        the original promise value
		 */
		this.selectAfter = function(selector, promise) {
			var self = this;
			return promise.then(function(value) {
				return [self.select(selector), value];
			});
		};
	}
});

'use strict';

define('js/utility/sort_alphabetic',
[
], function() {

	return function(property) {
		return function(a, b) {
			var aLower = a[property].toLowerCase(),
				bLower = b[property].toLowerCase();

			return (aLower < bLower ? -1 : aLower > bLower ? 1 : 0);
		};
	};
});

'use strict';

define('js/filters/thumbnail_path',
[
	'handlebars',
],
function(Handlebars) {

	function thumbnail_path(context, options) {
		return context;
	}

	Handlebars.registerHelper( 'thumbnail_path', thumbnail_path );

	return thumbnail_path;
});

/* START_TEMPLATE */
define('hbs!views/movies',['hbs','handlebars','js/filters/itemLink','js/filters/thumbnail_path'], function( hbs, Handlebars ){ 
var t = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	<li><a href=\"";
  foundHelper = helpers.itemLink;
  stack1 = foundHelper ? foundHelper.call(depth0, depth0, {hash:{}}) : helperMissing.call(depth0, "itemLink", depth0, {hash:{}});
  buffer += escapeExpression(stack1) + "\" alt=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n		<img src=\"";
  stack1 = depth0.art;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.poster;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n		<span class=\"movie-name\">";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n	</a></li>\n";
  return buffer;}

  stack1 = depth0.movies;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});
Handlebars.registerPartial('views_movies', t);
return t;
});
/* END_TEMPLATE */
;
'use strict';

define('js/components/movieviewer',
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'js/utility/sort_alphabetic',
	'hbs!views/movies',
],
function(defineComponent, VideoLibrary, mainView, promiseContent, sort_alphabetic, movieTemplate) {

	return defineComponent(movieViewer, mainView, promiseContent);

	function movieViewer() {

		this.show = function() {
			this.setContent(
				this.$node,
				movieTemplate,
				VideoLibrary.getMovies().
					then(function(movies) {
						return {
							"movies" : movies.sort(sort_alphabetic('title')),
						};
					})
			);
		};

		this.after('initialize', function() {
			this.on('show', this.show);
			this.activateOn(document, 'viewMovies');
		});
	}
});

/* START_TEMPLATE */
define('hbs!views/tv-shows',['hbs','handlebars','js/filters/slug','js/filters/thumbnail_path'], function( hbs, Handlebars ){ 
var t = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	<li><a href=\"#/tv-shows/";
  stack1 = depth0.title;
  foundHelper = helpers.slug;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "slug", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\">\n		<img alt=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" src=\"";
  stack1 = depth0.art;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.banner;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n	</a></li>\n";
  return buffer;}

  stack1 = depth0.tv_shows;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});
Handlebars.registerPartial('views_tv-shows', t);
return t;
});
/* END_TEMPLATE */
;
'use strict';

define('js/components/tvshowviewer',
[
	'components/flight/lib/component',
	'js/services/VideoLibrary',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'hbs!views/tv-shows',
],
function(defineComponent, VideoLibrary, mainView, promiseContent, tvShowTemplate) {

	return defineComponent(tvShowViewer, mainView, promiseContent);

	function tvShowViewer() {

		this.after('initialize', function() {
			this.setContent(
				this.$node,
				tvShowTemplate,
				VideoLibrary.getShows().
					then(function(tvShows) {
						return {
							"tv_shows" : tvShows,
						};
					})
			);

			this.activateOn(document, 'viewTVShows');
		});
	}
});

/* START_TEMPLATE */
define('hbs!views/episodes/seasons',['hbs','handlebars','js/filters/slug','js/filters/lpad','js/filters/thumbnail_path'], function( hbs, Handlebars ){ 
var t = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	<li data-season=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"><a href=\"#/tv-shows/";
  stack1 = depth0.showtitle;
  foundHelper = helpers.slug;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "slug", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "/S";
  stack1 = depth0.season;
  foundHelper = helpers.lpad;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 2, {hash:{}}) : helperMissing.call(depth0, "lpad", stack1, 2, {hash:{}});
  buffer += escapeExpression(stack1) + "\">\n		<img src=\"";
  stack1 = depth0.art;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.poster;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n		<span class=\"season-number\">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n	</a></li>\n";
  return buffer;}

  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});
Handlebars.registerPartial('views_episodes_seasons', t);
return t;
});
/* END_TEMPLATE */
;
'use strict';

define('js/filters/episodeClasses',
[
	'handlebars',
],
function(Handlebars) {

	function episodeClasses(episode) {
		var classes = [];

		if (episode.lastplayed) {
			classes.push("watched");
		}

		// TODO - add a "resume" class

		return classes.join(' ');
	}

	Handlebars.registerHelper( 'episodeClasses', episodeClasses );

	return episodeClasses;
});

/* START_TEMPLATE */
define('hbs!views/episodes/episodes',['hbs','handlebars','js/filters/episodeClasses','js/filters/itemLink','js/filters/thumbnail_path'], function( hbs, Handlebars ){ 
var t = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	<li data-season=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" data-episode=\"";
  foundHelper = helpers.episode;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.episode; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" class=\"";
  foundHelper = helpers.episodeClasses;
  stack1 = foundHelper ? foundHelper.call(depth0, depth0, {hash:{}}) : helperMissing.call(depth0, "episodeClasses", depth0, {hash:{}});
  buffer += escapeExpression(stack1) + "\"><a href=\"";
  foundHelper = helpers.itemLink;
  stack1 = foundHelper ? foundHelper.call(depth0, depth0, {hash:{}}) : helperMissing.call(depth0, "itemLink", depth0, {hash:{}});
  buffer += escapeExpression(stack1) + "\">\n		<img src=\"";
  stack1 = depth0.art;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.thumb;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n		<div class=\"episode-metadata\">\n			<span class=\"episode-number\">Season: ";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " / Episode: ";
  foundHelper = helpers.episode;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.episode; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n			<span class=\"episode-airdate\">";
  foundHelper = helpers.firstaired;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.firstaired; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n		</div>\n		<span class=\"episode-title\">";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n	</a></li>\n";
  return buffer;}

  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});
Handlebars.registerPartial('views_episodes_episodes', t);
return t;
});
/* END_TEMPLATE */
;
'use strict';

define('js/components/episodeviewer',
[
	'components/flight/lib/component',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'js/services/VideoLibrary',
	'when',
	'underscore',
	'hbs!views/episodes/seasons',
	'hbs!views/episodes/episodes',
],
function(defineComponent, mainView, promiseContent, VideoLibrary, when, _, seasonTemplate, episodeTemplate) {

	return defineComponent(episodeViewer, mainView, promiseContent);

	function episodeViewer() {
		this.defaultAttrs({
			"selectorSeasonList"  : ".season-selector",
			"selectorSeasons"     : ".season-selector li",
			"selectorEpisodeList" : ".episode-selector",
			"selectorEpisodes"    : ".episode-selector li",
		});

		this.fetchSeasons = function(tvshow) {
			return this.setContent('selectorSeasonList', seasonTemplate, tvshow.then(VideoLibrary.getShowSeasons));
		};

		this.fetchEpisodes = function(tvshow) {
			return this.setContent('selectorEpisodeList', episodeTemplate, tvshow.then(VideoLibrary.getEpisodes));
		};

		this.show = function(event, data) {
			// if the title slug doesn't match, reset the season and episode data
			if (this.currentShow !== data.title_slug) {
				var tvshow       = VideoLibrary.getShowFromSlug(data.title_slug);

				this.currentShow = data.title_slug;
				this.seasons     = this.fetchSeasons(tvshow);
				this.episodes    = this.fetchEpisodes(tvshow);

				this.trigger('view.change.tvshow.id', tvshow);
			}

			this.trigger('view.change.tvshow.season', data.season || 1);
		};

		this.setActiveSeason = function(event, season) {
			this.selectAfter('selectorSeasons', this.seasons).
				spread(function(elems) {
					elems.removeClass('active').
						filter('[data-season="' + season + '"]').
							addClass('active');
				});
		};

		this.filterEpisodeList = function(event, season) {
			this.selectAfter('selectorEpisodes', this.episodes).
				spread(function(elems) {
					elems.each(function() {
						$(this).toggle( $(this).data('season') == season );
					});
				});
		};

		this.after('initialize', function() {
			this.on('view.change.tvshow.season', this.setActiveSeason);
			this.on('view.change.tvshow.season', this.filterEpisodeList);

			this.on('show', this.show);
			this.activateOn(document, 'viewEpisodes');
		});
	}
});

'use strict';

define('js/filters/querystring',
[
	'handlebars',
],
function(Handlebars) {

	function querystring(str) {
		return encodeURIComponent(str);
	}

	Handlebars.registerHelper( 'querystring', querystring );

	return querystring;
});

/* START_TEMPLATE */
define('hbs!views/details-movie',['hbs','handlebars','js/filters/thumbnail_path','js/filters/querystring'], function( hbs, Handlebars ){ 
var t = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n		<li class=\"actor\">\n			<a href=\"http://www.imdb.com/find?s=nm&q=";
  stack1 = depth0.name;
  foundHelper = helpers.querystring;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "querystring", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\"\n				class=\"actor-photo\"\n				target=\"_blank\">\n			";
  stack1 = depth0.thumbnail;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</a>\n			<a href=\"http://www.imdb.com/find?s=nm&q=";
  stack1 = depth0.name;
  foundHelper = helpers.querystring;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "querystring", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\"\n				target=\"_blank\"\n				class=\"name\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>\n			";
  stack1 = depth0.role;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</li>\n	";
  return buffer;}
function program2(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n				<img alt=\"";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" src=\"";
  stack1 = depth0.thumbnail;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n			";
  return buffer;}

function program4(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n				<span class=\"role\">as\n					<a href=\"http://www.imdb.com/find?s=ch&q=";
  stack1 = depth0.role;
  foundHelper = helpers.querystring;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "querystring", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\"\n						target=\"_blank\">";
  foundHelper = helpers.role;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.role; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>\n				</span>\n			";
  return buffer;}

  buffer += "<img class=\"video-image\" alt=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" src=\"";
  stack1 = depth0.art;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.poster;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n<h3 class=\"video-title\">";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h3>\n<p class=\"video-plot\">";
  foundHelper = helpers.plot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.plot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</p>\n<ul class=\"video-cast\">\n	";
  stack1 = depth0.cast;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;});
Handlebars.registerPartial('views_details-movie', t);
return t;
});
/* END_TEMPLATE */
;
/* START_TEMPLATE */
define('hbs!views/details-episode',['hbs','handlebars','js/filters/thumbnail_path','js/filters/lpad','js/filters/querystring'], function( hbs, Handlebars ){ 
var t = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n		<li class=\"actor\">\n			<a href=\"http://www.imdb.com/find?s=nm&q=";
  stack1 = depth0.name;
  foundHelper = helpers.querystring;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "querystring", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\"\n				class=\"actor-photo\"\n				target=\"_blank\">\n			";
  stack1 = depth0.thumbnail;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</a>\n			<a href=\"http://www.imdb.com/find?s=nm&q=";
  stack1 = depth0.name;
  foundHelper = helpers.querystring;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "querystring", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\"\n				target=\"_blank\"\n				class=\"name\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>\n			";
  stack1 = depth0.role;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</li>\n	";
  return buffer;}
function program2(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n				<img alt=\"";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" src=\"";
  stack1 = depth0.thumbnail;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n			";
  return buffer;}

function program4(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n				<span class=\"role\">as\n					<a href=\"http://www.imdb.com/find?s=ch&q=";
  stack1 = depth0.role;
  foundHelper = helpers.querystring;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "querystring", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\"\n						target=\"_blank\">";
  foundHelper = helpers.role;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.role; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>\n				</span>\n			";
  return buffer;}

  buffer += "<img class=\"video-image\" alt=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" src=\"";
  stack1 = depth0.art;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.thumb;
  foundHelper = helpers.thumbnail_path;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "thumbnail_path", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\" />\n<h3 class=\"video-title\">S";
  stack1 = depth0.season;
  foundHelper = helpers.lpad;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 2, {hash:{}}) : helperMissing.call(depth0, "lpad", stack1, 2, {hash:{}});
  buffer += escapeExpression(stack1) + "E";
  stack1 = depth0.episode;
  foundHelper = helpers.lpad;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 2, {hash:{}}) : helperMissing.call(depth0, "lpad", stack1, 2, {hash:{}});
  buffer += escapeExpression(stack1) + " - ";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h3>\n<p class=\"video-plot\">";
  foundHelper = helpers.plot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.plot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</p>\n<ul class=\"video-cast\">\n	";
  stack1 = depth0.cast;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;});
Handlebars.registerPartial('views_details-episode', t);
return t;
});
/* END_TEMPLATE */
;
'use strict';

define('js/components/videodetails',
[
	'components/flight/lib/component',
	'js/mixins/main-view',
	'js/mixins/promiseContent',
	'js/services/VideoLibrary',
	'js/services/Player',
	'js/utility/sort_alphabetic',
	'js/utility/video_type',
	'hbs!views/details-movie',
	'hbs!views/details-episode',
],
function(defineComponent, mainView, promiseContent, VideoLibrary, Player, sort_alphabetic, video_type, movieDetails, episodeDetails) {

	return defineComponent(videoViewer, mainView, promiseContent);

	function videoViewer() {

		this.defaultAttrs({
			"selectorVideoImage" : ".video-image",
		});

		this.showEpisodeDetails = function(event, showData) {
			this.setContent(
				episodeDetails,
				VideoLibrary.getShowFromSlug(showData.title_slug).
					then(function(show) {
						return VideoLibrary.getEpisodeBySeasonEpisode(show, showData.season, showData.episode);
					}).
					then(function(episode) {
						episode.cast.sort(sort_alphabetic('name'));
						return episode;
					})
			);
		};

		this.showMovieDetails = function(event, movieData) {
			this.setContent(
				movieDetails,
				VideoLibrary.getMovieFromSlug(movieData.title_slug).
					then(function(movie) {
						movie.cast.sort(sort_alphabetic('name'));
						return movie;
					})
			);
		};

		this.playVideo = function(event) {
			var playWhich = (this.$node.hasClass('movie') ? 'playMovie' : 'playEpisode');

			Player[playWhich]( this.$node.data('source') );
		}

		this.updateDetailView = function(event, tmplData) {
			var videoType = video_type(tmplData);

			$(event.target).
				toggleClass('episode', videoType == 'episode').
				toggleClass('movie', videoType == 'movie').
				data('source', tmplData);
		};

		this.after('initialize', function() {
			this.on('click', {
				'selectorVideoImage': this.playVideo,
			});

			this.on('change.content', this.updateDetailView);

			this.on(document, 'viewEpisodeDetails', this.showEpisodeDetails);
			this.on(document, 'viewMovieDetails', this.showMovieDetails);
			this.activateOn(document, 'viewEpisodeDetails viewMovieDetails');
		});
	}
});

require.config({
	deps : [
		'js/utility/features',
	],
	shim : {
		"underscore" : {
			exports : '_',
		},
	},
	paths : {
		"hbs" : "components/require-handlebars-plugin/hbs",
		"underscore" : "components/underscore/underscore",
		"handlebars" : "components/require-handlebars-plugin/Handlebars",
		"i18nprecompile" : "components/require-handlebars-plugin/hbs/i18nprecompile",
		"json2" : "components/require-handlebars-plugin/hbs/json2",

		"crossroads" : "components/crossroads.js/dist/crossroads",
		"signals" : "components/js-signals/dist/signals",
	},
	packages : [
		{
			"name"     : "when",
			"location" : "components/when",
			"main"     : "debug",
		},
	],
	hbs : {
		disableI18n: true,
		helperPathCallback : function(name) {
			return 'js/filters/' + name;
		},
		templateExtension : "html",
	},
});
require(
[
	'js/routes',
	'js/components/remote',
	'js/components/now-playing',
	'js/components/movieviewer',
	'js/components/tvshowviewer',
	'js/components/episodeviewer',
	'js/components/videodetails',
],
function(router, remote, nowPlaying, movieViewer, tvShowViewer, episodeViewer, detailsViewer) {
	remote.attachTo('#remote');
	nowPlaying.attachTo('#now-playing');
	movieViewer.attachTo('#movies');
	tvShowViewer.attachTo("#tv-shows");
	episodeViewer.attachTo("#episodes");
	detailsViewer.attachTo("#video-details");

	$(window).trigger('hashchange');
});

define("config", function(){});
}());