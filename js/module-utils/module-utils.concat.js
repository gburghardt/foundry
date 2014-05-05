/*! module-utils 2014-05-05 */
/*! module-utils 2014-05-05 */
(function(global) {

var toString = global.Object.prototype.toString;

function isArray(x) {
	return toString.call(x) === "[object Array]";
}

function merge(source, destination, safe) {
	for (var key in source) {
		if (source.hasOwnProperty(key) && (!safe || !destination.hasOwnProperty(key))) {
			destination[key] = source[key];
		}
	}
}

function includeAll(mixins, Klass) {
	if (!Klass) {
		throw new Error("Missing required argument: Klass");
	}

	mixins = isArray(mixins) ? mixins : [mixins];

	var i = 0, length = mixins.length;

	for (i; i < length; i++) {
		if (!mixins[i]) {
			throw new Error("Mixin at index " + i + " is null or undefined");
		}

		Klass.include(mixins[i]);
	}
}

function include(mixin) {
	var key, Klass = this;

	// include class level methods
	if (mixin.self) {
		merge(mixin.self, Klass, true);
	}

	// include instance level methods
	if (mixin.prototype) {
		merge(mixin.prototype, Klass.prototype, true);
	}

	// include other mixins
	if (mixin.includes) {
		includeAll(mixin.includes, Klass);
	}

	if (mixin.included) {
		mixin.included(Klass);
	}

	mixin = null;
}

function extend(descriptor) {
	descriptor = descriptor || {};

	var key, i, length, ParentKlass = this;

	// Constructor function for our new class
	var ChildKlass = function ChildKlass() {
		this.initialize.apply(this, arguments);
	};

	// "inherit" class level methods
	merge(ParentKlass, ChildKlass);

	// new class level methods
	if (descriptor.self) {
		merge(descriptor.self, ChildKlass);
	}

	// Set up true prototypal inheritance
	ChildKlass.prototype = Object.create(ParentKlass.prototype);

	// new instance level methods
	if (descriptor.prototype) {
		merge(descriptor.prototype, ChildKlass.prototype);
	}

	// apply mixins
	if (descriptor.includes) {
		includeAll(descriptor.includes, ChildKlass);
	}

	ChildKlass.prototype.initialize = ChildKlass.prototype.initialize || function initialize() {};
	ChildKlass.prototype.constructor = ChildKlass;

	ParentKlass = descriptor = null;

	return ChildKlass;
}

// Make "include" available to the World
if (!global.Function.prototype.include) {
	global.Function.prototype.include = include;
}

// Make "extend" available to the World
if (!global.Function.prototype.extend) {
	if (global.Object.extend) {
		// Some JavaScript libraries already have an "extend" function
		global.Object._extend = extend;
	}

	global.Function.prototype.extend = extend;
}

})(this);

function Callbacks(context, types) {
	if (context) {
		this.context = context;
		this.types = types || {};
	}
}

Callbacks.prototype = {

	context: null,

	types: null,

	destructor: function destructor() {
		this.context = this.types = null;
	},

	add: function add(name, method) {
		if (!this.types[name]) {
			this.types[name] = [];
		}

		this.types[name].push(method);

		return this;
	},

	execute: function execute(name) {
		if (!this.types[name]) {
			return true;
		}

		var args = Array.prototype.slice.call(arguments, 1, arguments.length);
		var method, i = 0, length = this.types[name].length;
		var success = true;

		for (i; i < length; i++) {
			method = this.types[name][i];

			if (!this.context[method]) {
				throw new Error("No callback method found: " + method);
			}

			if (this.context[method].apply(this.context, args) === false) {
				success = false;
				break;
			}
		}

		return success;
	},

	remove: function remove(name, method) {
		if (!this.types[name]) {
			return;
		}

		var i = 0, length = this.types[name].length, m;

		for (i; i < length; i++) {
			if (method === this.types[name][i]) {
				this.types[name].splice(i, 1);
				break;
			}
		}

		return this;
	}

};

Callbacks.Utils = {
	self: {
		addCallback: function addCallback(name, method) {
			this.prototype.callbacks = this.prototype.callbacks || {};

			if (!this.prototype.callbacks[name]) {
				this.prototype.callbacks[name] = [];
			}
			else if (!this.prototype.callbacks[name] instanceof Array) {
				this.prototype.callbacks[name] = [this.prototype.callbacks[name]];
			}

			this.prototype.callbacks[name].push(method);

			return this;
		}
	},

	prototype: {
		callbacks: null,

		initCallbacks: function initCallbacks(types) {
			if (!this.hasOwnProperty("callbacks")) {
				this.callbacks = new Callbacks(this);
			}

			if (types) {
				this.callbacks.types = types;
			}
		},

		destroyCallbacks: function destroyCallbacks() {
			if (this.callbacks) {
				this.callbacks.destructor();
				this.callbacks = null;
			}
		}
	}
};

Module.Utils = {
	include: function(mixin) {
		if (Module.Base)
			Module.Base.include(mixin);
	}
};

Module.Utils.Bootstrap = {
	includes: [
		Callbacks.Utils
	],

	included: function(Klass) {
		// Forcefully override methods
		var proto = Klass.prototype;

		if (proto.initialize !== Module.Utils.Bootstrap.prototype.initialize) {
			proto._originalInitialize = proto.initialize || function emptyInitialize() {};
			proto.initialize = Module.Utils.Bootstrap.prototype.initialize;
		}
		else {
			proto.initialize = function emptyInitialize() {};
		}

		if (proto.init !== Module.Utils.Bootstrap.prototype.init) {
			proto._originalInit = proto.init || function emptyInit() {};
			proto.init = Module.Utils.Bootstrap.prototype.init;
		}
		else {
			proto.init = function emptyInit() {};
		}

		if (proto.destructor !== Module.Utils.Bootstrap.prototype.destructor) {
			proto._originalDestructor = proto.destructor || function emptyDestructor() {};
			proto.destructor = Module.Utils.Bootstrap.prototype.destructor;
		}
		else {
			proto.destructor = function emptyDestructor() {};
		}

		proto = null;
	},

	prototype: {

		initialize: function() {
			this._originalInitialize.call(this);
			this.setOptions(this.mergeProperty("options"));
		},

		init: function(elementOrId, options) {
			this._originalInit.call(this, elementOrId, options);
			this.initCallbacks(this.mergeProperty("callbacks"));
			this.callbacks.execute("beforeReady");
			this._ready();
			this.callbacks.execute("afterReady");

			if (!this._isLoading) {
				this._loaded();
			}

			opts = null;

			return this;
		},

		destructor: function(keepElement) {
			this.callbacks.execute("destroy", keepElement);
			this.destroyCallbacks();
			this._originalDestructor.call(this, keepElement);
		},

		_ready: function() {
		},

		cancel: function(event, element, params) {
			event.stop();
			this.destructor();
			event = element = params = null;
		}

	}

};

Module.Utils.include(Module.Utils.Bootstrap);

Module.Utils.PropertyCache = {

	self: {

		cache: null,

		fromCache: function() {
			var toString = Object.prototype.toString,
			    isArray = function(x) { return toString.call(x) === "[object Array]"; };

			function defaultMerge(destination, source, key, klass) {
				var name, value, i, length;

				for (name in source) {
					if (source.hasOwnProperty(name)) {
						value = source[name];

						if (isArray(value)) {
							if (!destination[name]) {
								destination[name] = value;
							}
							else {
								destination[name] = destination[name] || [];

								for (i = 0, length = value.length; i < length; i++) {
									if (destination[name].indexOf(value[i]) < 0) {
										destination[name].unshift(value[i]);
									}
								}
							}
						}
						else if (!destination.hasOwnProperty(name)) {
							destination[name] = source[name];
						}
					}
				}
			}

			return function fromCache(key, name, callback, context) {
				this.cache = this.cache || {};

				if (this.cache[key]) {
					return this.cache[key];
				}

				if (!callback) {
					callback = defaultMerge;
					context = this;
				}
				else {
					context = context || null;
				}

				var proto = this.prototype, value = {};

				while (proto) {
					if (proto.hasOwnProperty(name) && proto[name]) {
						callback.call(context, value, proto[name], key, this);
					}

					proto = proto.__proto__;
				}

				return (this.cache[key] = value);
			};
		}()

	},

	prototype: {

		mergeProperty: function mergeProperty(name, callback, context) {
			var key = this.guid ? this.guid + "." + name : name;
			return this.constructor.fromCache(key, name, callback, context);
		}

	}

};

Module.Utils.include(Module.Utils.PropertyCache);

Module.Utils.Rendering = {

	included: function(Klass) {
		Klass.addCallback("destroy", "_destroyRenderingEngine");
	},

	prototype: {

		renderingEngine: null,

		_destroyRenderingEngine: function _destroyRenderingEngine() {
			this.renderingEngine = null;
		},

		render: function render(name, data, elementOrId) {
			return this.renderingEngine.render(name, data, elementOrId);
		}

	}

};

Module.Utils.include(Module.Utils.Rendering);

/*! module-utils 2014-05-05 */
function ElementStore() {
}
ElementStore.prototype = {

	_cache: null,

	config: null,

	_document: null,

	returnNative: false,

	_root: null,

	constructor: ElementStore,

	init: function init(root) {
		if (!root) {
			throw new Error("Missing required argument: root");
		}

		this.config = this.config || { elements: {}, collections: {} };
		this._cache = {};
		this.setRoot(root);

		if (!this.createElement) {
			this.createElement = this._createElement;
		}

		if (!this.parseHTML) {
			this.parseHTML = this._parseHTML;
		}

		if (!this.querySelector) {
			this.querySelector = this._querySelector;
		}

		if (!this.querySelectorAll) {
			this.querySelectorAll = this._querySelectorAll;
		}

		this.eagerLoad();

		return this;
	},

	destructor: function destructor() {
		if (this._cache) {
			this.clearCache();
			this._cache = null;
		}

		this.config = this._root = this._document = null;
	},

	clearCache: function clearCache() {
		var key;

		for (key in this._cache) {
			if (this._cache.hasOwnProperty(key)) {
				this._cache[key] = null;
			}
		}

		return this;
	},

	_createElement: function _createElement(tagName) {
		return this._document.createElement(tagName);
	},

	eagerLoad: function eagerLoad() {
		var key, conf;

		for (key in this.config.elements) {
			if (this.config.elements.hasOwnProperty(key)) {
				conf = this.config.elements[key];

				if (conf.eager && !conf.nocache) {
					this._cache[key] = this.getElement(key);
				}
			}
		}

		for (key in this.config.collections) {
			if (this.config.collections.hasOwnProperty(key)) {
				conf = this.config.collections[key];

				if (conf.eager && !conf.nocache) {
					this.getCollection(key);
				}
			}
		}

		return this;
	},

	get: function get(key) {
		return this.getElement(key) || this.getCollection(key) || null;
	},

	getCollection: function getCollection(key) {
		var collection;

		if (!this.config.collections[key]) {
			collection = null;
		}
		else if (this._cache[key]) {
			collection = this._cache[key];
		}
		else if (this.config.collections[key].selector) {
			collection = this.querySelectorAll(this.config.collections[key].selector);

			if (!this.config.collections[key].nocache) {
				this._cache[key] = collection;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for collection " + key);
		}

		return collection;
	},

	getElement: function getElement(key) {
		var element;

		if (!this.config.elements[key]) {
			element = null;
		}
		else if (this._cache[key]) {
			element = this._cache[key];
		}
		else if (this.config.elements[key].selector) {
			element = this.querySelector(this.config.elements[key].selector);

			if (!this.config.elements[key].nocache) {
				this._cache[key] = element;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for element " + key);
		}

		return element;
	},

	isCollection: function isCollection(key) {
		return this.config.collections.hasOwnProperty(key);
	},

	isElement: function isElement(key) {
		return this.config.elements.hasOwnProperty(key);
	},

	keys: function keys() {
		var keys = [], key;

		for (key in this.config.elements) {
			if (this.config.elements.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		for (key in this.config.collections) {
			if (this.config.collections.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		return keys;
	},

	_mergeConfigs: function _mergeConfigs(config, overrides, safe) {
		for (key in overrides) {
			if (overrides.hasOwnProperty(key) && (config[key] === undefined || !safe)) {
				config[key] = overrides[key];
			}
		}
	},

	_parseHTML: function _parseHTML(html) {
		html = html.replace(/^\s+|\s+$/g, "");
		var div = this.createElement("div");
		div.innerHTML = html;
		var elements = [], i = div.childNodes.length;

		while (i--) {
			elements.push(div.childNodes[i]);
			div.removeChild(div.childNodes[i]);
		}

		div = null;

		return elements;
	},

	setConfig: function setConfig(overrides, safe) {
		this.config = this.config || { elements: {}, collections: {} };

		if (overrides.elements) {
			this._mergeConfigs(this.config.elements, overrides.elements, safe)
		}

		if (overrides.collections) {
			this._mergeConfigs(this.config.collections, overrides.collections, safe)
		}

		return this;
	},

	setRoot: function setRoot(root) {
		this.clearCache();
		this._root = root;
		this._document = this._root.nodeName === "#document" ? this._root : this._root.ownerDocument;

		return this;
	},

	toString: function toString() {
		return "[object ElementStore]";
	},

	_querySelector: function _querySelector(selector, element) {
		return (element || this._root).querySelector(selector);
	},

	_querySelectorAll: function _querySelectorAll(selector, element) {
		return (element || this._root).querySelectorAll(selector);
	}

};

// @import Inherit.js
// @requires ElementStore

ElementStore.Utils = {
	prototype: {
		elementStore: {},

		destroyElementStore: function destroyElementStore() {
			if (this.elementStore) {
				this.elementStore.destructor();
				this.elementStore = null;
			}
		},

		initElementStore: function initElementStore(root) {
			if (!this.hasOwnProperty("elementStore")) {
				this.elementStore = new ElementStore();
			}

			this._compileElementStore();
			this._initGetters();
			this.elementStore.init(root);
		},

		_initGetters: function _initGetters() {
			if (this.__proto__.hasOwnProperty("__elementStoreGettersCreated__")) {
				return;
			}

			var key, propertyName, proto = this.__proto__;
			var elements = this.elementStore.config.elements;
			var collections = this.elementStore.config.collections;

			if (!this.createElementGetter) {
				this.createElementGetter = this._createElementGetter;
			}

			if (!this.createCollectionGetter) {
				this.createCollectionGetter = this._createCollectionGetter;
			}

			for (key in elements) {
				if (elements.hasOwnProperty(key)) {
					if (!proto[key]) {
						propertyName = key;
					}
					else if (!proto[key + "Element"]) {
						propertyName = key + "Element";
					}
					else {
						throw new Error("Cannot create element getter: " + key);
					}

					this.createElementGetter(key, propertyName);
				}
			}

			for (key in collections) {
				if (collections.hasOwnProperty(key)) {
					if (!proto[key]) {
						propertyName = key;
					}
					else if (!proto[key + "Collection"]) {
						propertyName = key + "Collection";
					}
					else {
						throw new Error("Cannot create collection getter: " + key);
					}

					this.createCollectionGetter(key, propertyName);
				}
			}

			proto.__elementStoreGettersCreated__ = true;

			elements = collections = proto = null;
		},

		clearElementStoreCache: function clearElementStoreCache() {
			this.elementStore.clearCache();
		},

		collection: function collection(key) {
			return this.elementStore.getCollection(key);
		},

		_compileElementStore: function _compileElementStore() {
			if (this.__proto__.hasOwnProperty("_compiledElementStore")) {
				// Use the cached config
				this.elementStore.setConfig(this.__proto__._compiledElementStore);

				return;
			}

			var proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("elementStore")) {
					this.elementStore.setConfig(proto.elementStore, true);
				}

				proto = proto.__proto__;
			}

			// Cache this config for later instances
			this.__proto__._compiledElementStore = this.elementStore.config;
		},

		_createCollectionGetter: function _createCollectionGetter(key, propertyName) {
			var getter = function collectionGetter() {
				return this.elementStore.getCollection(key);
			};

			this.__proto__[propertyName] = getter;
		},

		_createElementGetter: function _createElementGetter(key, propertyName) {
			var getter = function elementGetter() {
				return this.elementStore.getElement(key);
			};

			this.__proto__[propertyName] = getter;
		},

		element: function element(key) {
			return this.elementStore.getElement(key);
		}
	}
};

Module.Utils.ElementStore = {

	includes: [
		ElementStore.Utils
	],

	included: function(Klass) {
		Klass.addCallback("beforeReady", "_initElementStore");
		Klass.addCallback("destroy", "destroyElementStore");
	},

	prototype: {
		_initElementStore: function _initElementStore() {
			this.initElementStore(this.element);
		}
	}

};

Module.Utils.include(Module.Utils.ElementStore);

/*! module-utils 2014-05-05 */
(function() {

	function include(Klass, mixin) {
		if (mixin.self) {
			merge(mixin.self, Klass, true);
		}

		if (mixin.prototype) {
			merge(mixin.prototype, Klass.prototype, true);
		}

		if (mixin.included) {
			mixin.included(Klass);
		}
	}

	function merge(source, destination, safe) {
		var key, undef;

		for (key in source) {
			if (source.hasOwnProperty(key) &&
				(!safe || destination[key] === undef)) {
				destination[key] = source[key];
			}
		}

		source = destination = null;
	}

	var Beacon = {
		setup: function setup(Klass) {
			if (Beacon.ApplicationEvents) {
				include(Klass, Beacon.ApplicationEvents);

				if (Beacon.Notifications) {
					include(Klass, Beacon.Notifications);
				}
			}
		}
	};

	window.Beacon = Beacon;

})();

Beacon = (function(Beacon) {

	function Dispatcher() {
		this._subscribers = {};
	}

	Dispatcher.prototype = {

		_subscribers: null,

		constructor: Dispatcher,

		destructor: function destructor() {
			if (!this._subscribers) {
				return;
			}

			var subscribers = this._subscribers,
			    subscriber,
			    eventType,
			    i, length;

			for (eventType in subscribers) {
				if (subscribers.hasOwnProperty(eventType)) {
					for (i = 0, length = subscribers[eventType].length; i < length; i++) {
						subscriber = subscribers[eventType][i];
						subscriber.callback = subscriber.context = null;
					}

					subscribers[eventType] = null;
				}
			}

			subscriber = subscribers = this._subscribers = null;
		},

		_dispatchEvent: function _dispatchEvent(publisher, data, subscribers) {
			var subscriber,
			    result,
			    i = 0,
			    length = subscribers.length;

			for (i; i < length; i++) {
				subscriber = subscribers[i];

				if (subscriber.type === "function") {
					result = subscriber.callback.call(subscriber.context, publisher, data);
				}
				else if (subscriber.type === "string") {
					result = subscriber.context[ subscriber.callback ](publisher, data);
				}

				if (result === false) {
					break;
				}
			}

			subscribers = subscriber = publisher = data = null;

			return result !== false;
		},

		publish: function publish(eventType, publisher, data) {
			if (!this._subscribers[eventType]) {
				return true;
			}

			var result = this._dispatchEvent(publisher, data, this._subscribers[eventType]);

			publisher = data = null;

			return result;
		},

		subscribe: function subscribe(eventType, context, callback) {
			var contextType = typeof context;
			var callbackType = typeof callback;

			this._subscribers[eventType] = this._subscribers[eventType] || [];

			if (contextType === "function") {
				this._subscribers[eventType].push({
					context: null,
					callback: context,
					type: "function"
				});
			}
			else if (contextType === "object") {
				if (callbackType === "string" && typeof context[ callback ] !== "function") {
					throw new Error("Cannot subscribe to " + eventType + " because " + callback + " is not a function");
				}

				this._subscribers[eventType].push({
					context: context || null,
					callback: callback,
					type: callbackType
				});
			}
		},

		unsubscribe: function unsubscribe(eventType, context, callback) {

			if (this._subscribers[eventType]) {
				var contextType = typeof context,
				    callbackType = typeof callback,
				    subscribers = this._subscribers[eventType],
				    i = subscribers.length,
				    subscriber;

				if (contextType === "function") {
					callback = context;
					context = null;
					callbackType = "function";
				}
				else if (contextType === "object" && callbackType === "undefined") {
					callbackType = "any";
				}

				while (i--) {
					subscriber = subscribers[i];

					if (
					    (callbackType === "any" && subscriber.context === context) ||
						(subscriber.type === callbackType && subscriber.context === context && subscriber.callback === callback)
					) {
						subscribers.splice(i, 1);
					}
				}

				subscribers = subscriber = null;
			}

			context = callback = null;
		},

		unsubscribeAll: function unsubscribeAll(context) {
			var type, i, subscribers;

			for (type in this._subscribers) {
				if (this._subscribers.hasOwnProperty(type)) {
					subscribers = this._subscribers[type];
					i = subscribers.length;

					while (i--) {
						if (subscribers[i].context === context) {
							subscribers.splice(i, 1);
						}
					}
				}
			}

			context = subscribers = null;
		}

	};

	Beacon.Dispatcher = Dispatcher;

	return Beacon;

})(window.Beacon || {});
Beacon = (function(Beacon) {

	var ApplicationEvents = {

		eventDispatcher: null,

		self: {

			getEventDispatcher: function getEventDispatcher() {
				if (!Beacon.ApplicationEvents.eventDispatcher) {
					Beacon.ApplicationEvents.eventDispatcher = new Beacon.Dispatcher();
				}

				return Beacon.ApplicationEvents.eventDispatcher;
			},

			publish: function publish(eventName, publisher, data) {
				return this.getEventDispatcher().publish(eventName, publisher, data);
			},

			subscribe: function subscribe(eventName, context, callback) {
				this.getEventDispatcher().subscribe(eventName, context, callback);
			},

			unsubscribe: function unsubscribe(eventName, context, callback) {
				this.getEventDispatcher().unsubscribe(eventName, context, callback);
			}

		},

		prototype: {

			eventDispatcher: null,

			_initApplicationEvents: function _initApplicationEvents() {
				if (!this.hasOwnProperty("eventDispatcher")) {
					this.eventDispatcher = this.constructor.getEventDispatcher();
				}
			},

			_destroyApplicationEvents: function _destroyApplicationEvents() {
				if (this.eventDispatcher) {
					this.eventDispatcher.unsubscribe(this);
				}
			},

			publish: function publish(eventName, data) {
				return this.eventDispatcher.publish(eventName, this, data);
			},

			subscribe: function subscribe(eventName, context, callback) {
				this.eventDispatcher.subscribe(eventName, context, callback);

				return this;
			},

			unsubscribe: function unsubscribe(eventName, context, callback) {
				this.eventDispatcher.unsubscribe(eventName, context, callback);

				return this;
			}

		}

	};

	Beacon.ApplicationEvents = ApplicationEvents;

	return Beacon;

})(window.Beacon || {});

Beacon = (function(Beacon) {

	var _guid = 0;

	var Notifications = {

		self: {

			addNotifications: function addNotifications(newNotifications) {
				var name, notifications = this.prototype.notifications || {};

				for (name in newNotifications) {
					if (newNotifications.hasOwnProperty(name)) {
						if (notifications[name]) {
							notifications[name] = (notifications[name] instanceof Array) ? notifications[name] : [ notifications[name] ];
						}
						else {
							notifications[name] = [];
						}

						notifications[name].push( newNotifications[name] );
					}
				}

				this.prototype.notifications = notifications;
				notifications = newNotifications = null;
			}

		},

		prototype: {

			_notificationDispatcher: null,

			_notificationId: null,

			_notificationIdPrefix: "notifications",

			notifications: null,

			_initNotifications: function _initNotifications() {
				if (!this.__proto__.hasOwnProperty("_compiledNotifications")) {
					this._compileNotifications();
				}

				this._initApplicationEvents();

				this._notificationId = _guid++;

				var name, i, length, notifications;

				for (name in this._compiledNotifications) {
					if (this._compiledNotifications.hasOwnProperty(name)) {
						notifications = this._compiledNotifications[name];

						for (i = 0, length = notifications.length; i < length; i++) {
							this.listen( name, this, notifications[i] );
						}
					}
				}

				this._setUpNotifications();
			},

			_compileNotifications: function _compileNotifications() {
				var _compiledNotifications = {}, name, i, length, notifications, proto = this.__proto__;

				while (proto) {
					if (proto.hasOwnProperty("notifications") && proto.notifications) {
						notifications = proto.notifications;

						for (name in notifications) {
							if (notifications.hasOwnProperty(name)) {
								_compiledNotifications[name] = _compiledNotifications[name] || [];
								notifications[name] = notifications[name] instanceof Array ? notifications[name] : [ notifications[name] ];

								// To keep notifications executing in the order they were defined in the classes,
								// we loop backwards and place the new notifications at the top of the array.
								i = notifications[name].length;
								while (i--) {
									_compiledNotifications[name].unshift( notifications[name][i] );
								}
							}
						}
					}

					proto = proto.__proto__;
				}

				this.__proto__._compiledNotifications = _compiledNotifications;

				proto = notifications = _compiledNotifications = null;
			},

			_destroyNotifications: function _destroyNotifications() {
				if (this._notificationDispatcher) {
					this._notificationDispatcher.destructor();
					this._notificationDispatcher = null;
				}
			},

			_setUpNotifications: function _setUpNotifications() {
				// Child classes may override this to do something special with adding notifications.
			},

			notify: function notify(message, data) {
				var success = this.publish(this._notificationIdPrefix + "." + this._notificationId + "." + message, data);
				data = null;
				return success;
			},

			listen: function listen(message, context, notification) {
				this.subscribe(this._notificationIdPrefix + "." + this._notificationId + "." + message, context, notification);
				context = notification = null;

				return this;
			},

			ignore: function ignore(message, context, notification) {
				this.unsubscribe(this._notificationIdPrefix + "." + this._notificationId + "." + message, context, notification);
				context = notification = null;

				return this;
			}

		}

	};

	Beacon.Notifications = Notifications;

	return Beacon;

})(window.Beacon || {});

Module.Utils.Events = {
	included: function(Klass) {
		Beacon.setup(Klass);
		Klass.addCallback("beforeReady", "_initApplicationEvents");
	}
};

Module.Utils.include(Module.Utils.Events);
