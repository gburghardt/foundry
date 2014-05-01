/*! foundry 2014-04-30 */
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

var Oxydizr = {};
Oxydizr.FrontController = function FrontController() {
	this.events = {};
	this.controllers = {};
	this.handleEvent = this.handleEvent.bind(this);
	this.handleEnterpress = this.handleEnterpress.bind(this);
}

Oxydizr.FrontController.prototype = {

	catchErrors: false,

	controllers: null,

	element: null,

	errorHandler: {
		handleError: function(error, controller, event, element, params, action, controllerId) {
			console.error(error);

			console.log({
				controller: controller,
				event: event,
				element: element,
				params: params,
				action: action,
				controllerId: controllerId
			});

			return true;
		}
	},

	events: null,

	constructor: Oxydizr.FrontController,

	destructor: function() {
		if (this.controllers) {
			for (var controllerId in this.controllers) {
				if (this.controllers.hasOwnProperty(controllerId)) {
					this.unregisterController(this.controllers[controllerId]);
					this.controllers[controllerId] = null;
				}
			}

			this.controllers = null;
		}

		if (this.events) {
			for (var eventName in this.events) {
				if (this.events.hasOwnProperty(eventName)) {
					this._removeEvent(this.element, eventName, this.events[eventName]);
				}
			}

			this.events = null;
		}

		this.element = null;
	},

	init: function(element) {
		if (element) {
			this.element = element;
		}

		if (!this.element) {
			throw new Error("Missing required argument: element");
		}

		// click and submit events are so common that we just subscribe to them
		this.registerEvents("click", "submit");

		return this;
	},

	_addEvent: function(element, eventName, eventInfo) {
		if (!this.events[eventName]) {
			this.events[eventName] = eventInfo;
			this._addEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
		}
	},

	_addEventListener: function(element, name, handler, capture) {
		element.addEventListener(name, handler, capture);
	},

	_createDelegateId: function() {
		var index = 1000;

		return function() {
			return String(++index);
		};
	}(),

	_getActions: function(element) {
		var actionsAttr = element.getAttribute("data-actions");

		if (!actionsAttr || /^\s*$/.test(actionsAttr)) {
			return [];
		}
		else {
			return actionsAttr
				.replace(/^\s+|\s+$/g, "")
				.split(/[.\s+]/g);
		}
	},

	_getMethodFromAction: function(controller, action, event) {
		var method = null;

		if (controller[action] && controller[action].name === (event.__type || event.type)) {
			method = action;
		}
		else if (controller.handleAction) {
			method = "handleAction";
		}

		return method;
	},

	_getParams: function(event, element) {
		var attr = element.getAttribute("data-action-params");

		return (attr) ? JSON.parse(attr) : {};
	},

	handleEnterpress: function(event) {
		if (event.keyCode === 13) {
			event.__type = "enterpress";
			this.handleEvent(event);
		}
	},

	_handleError: function(error, controller, controllerId, action, event, element, params) {
		if (controller && controller.handleActionError) {
			return controller.handleActionError(error, event, element, params, action, controller, controllerId);
		}
		else if (this.errorHandler) {
			return this.errorHandler.handleActionError(error, controller, event, element, params, action, controllerId);
		}

		return false;
	},

	handleEvent: function(event) {
		this._patchEvent(event);
		this._propagateEvent(event.target, event);
		this._unpatchEvent(event);
	},

	_invokeAction: function(controllerId, action, event, element, params) {
		var controller = this.controllers[controllerId] || null,
		    method = null;

		if (!controller) {
			event.stop();
			throw new Error("No controller registered for " + controllerId);
		}
		else if (method = this._getMethodFromAction(controller, action, event)) {
			if (this.catchErrors) {
				try {
					controller[method](event, element, params, action);
				}
				catch (error) {
					event.stop();

					if (!this._handleError(error, controller, controllerId, action, event, element, params)) {
						throw error;
					}
				}
			}
			else {
				controller[method](event, element, params, action);
			}
		}
	},

	_patchEvent: function(event) {
		event.__isStopped = false;
		event.__stopPropagation = event.stopPropagation;
		event.stopPropagation = function() {
			event.__stopPropagation();
			this.__isStopped = true;
		};
		event.__stop = event.stop || null;
		event.stop = function() {
			if (this.__stop) {
				this.__stop();
			}

			this.preventDefault();
			this.stopPropagation();
		};
	},

	_propagateEvent: function(element, event) {
		var actions = this._getActions(element),
		    params = this._getParams(event, element),
		    controllerId, action, actionParams;

		for (var i = 0, length = actions.length; i < length; i += 2) {
			controllerId = actions[i];
			action = actions[i + 1];
			actionParams = params[controllerId + "." + action] || {};
			this._invokeAction(controllerId, action, event, element, actionParams);

			if (event.__isStopped) {
				break;
			}
		}

		if (event.__isStopped || element === this.element) {
			// do nothing
		}
		else if (element.parentNode) {
			this._propagateEvent(element.parentNode, event);
		}
	},

	_registerEvent: function(eventName) {
		var eventInfo = {
			name: eventName,
			handler: this.handleEvent,
			capture: false
		};

		if (eventName === "enterpress") {
			eventInfo.name = "keypress";
			eventInfo.handler = this.handleEnterpress;
		}
		else if (eventName === "focus" || eventName === "blur") {
			eventInfo.capture = true;
		}

		this._addEvent(this.element, eventName, eventInfo);
	},

	registerEvents: function() {
		for (var i = 0, length = arguments.length; i < length; i++) {
			this._registerEvent(arguments[i]);
		}

		return this;
	},

	registerController: function(controller) {
		var controllerId = controller.controllerId || (controller.controllerId = this._createDelegateId());

		if (this.controllers[controllerId]) {
			throw new Error("Cannot register duplicate delegate Id: " + controllerId);
		}

		this.controllers[controllerId] = controller;

		controller.onControllerRegistered(this, controllerId);

		return controllerId;
	},

	_removeEvent: function(element, eventName, eventInfo) {
		if (this.events[eventName]) {
			this._removeEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
			this.events[eventName] = this.events[eventName].handler = null;
		}
	},

	_removeEventListener: function(element, name, handler, capture) {
		element.removeEventListener(name, handler, capture);
	},

	_unpatchEvent: function(event) {
		event.stopPropagation = event.__stopPropagation;
		event.stop = event.__stop || null;
		event.__stop = event.__stopPropagation = event.__isStopped = null;
	},

	unregisterController: function(controller) {
		var controllerId = controller.controllerId;

		if (!controllerId || !this.controllers[controller.controllerId]) {
			return false;
		}
		else {
			this.controllers[controller.controllerId] = null;
			delete this.controllers[controller.controllerId];
			controller.onControllerUnregistered(this);
			return true;
		}
	}

};
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

this.Hypodermic = {};

(function(global) {

var globals = [
	"applicationCache",
	"console",
	"document",
	"localStorage",
	"location",
	"navigator",
	"screen",
	"sessionStorage"
], globalSingletons = { global: global };

for (var i = 0, key, length = globals.length; i < length; i++) {
	key = globals[i];

	if (key in global) {
		globalSingletons[key] = global[key];
	}
}

function Container(_configs) {

	if (!_configs) {
		throw new Error("Missing required argument: configs");
	}

	var _dependencyResolver = new Hypodermic.DependencyResolver(this),
	    _objectFactory = new Hypodermic.ObjectFactory(this, _dependencyResolver),
	    _singletons = Object.create(globalSingletons);

	_singletons.container = this;

	this.resolve = function(name, unsafe) {
		var instance = null,
		    config = _configs[name],
		    propertiesSet = {};

		if (_singletons[name]) {
			instance = _singletons[name];
		}
		else if (!config) {
			if (unsafe) {
				throw new Error("No configuration found for " + name);
			}
		}
		else if (config.abstract) {
			throw new Error("Cannot create resolve abstract config: " + name);
		}
		else {
			if (config.factory) {
				instance = _objectFactory.createInstanceFromFactory(config);
			}
			else {
				instance = _objectFactory.createInstance(config, config.constructorArgs);
			}

			if (config.singleton) {
				_singletons[name] = instance;
			}

			_dependencyResolver.injectDependencies(instance, config, propertiesSet);

			while (config = _configs[config.parent]) {
				_dependencyResolver.injectDependencies(instance, config, propertiesSet);
			}
		}

		return instance;
	};
}

global.Hypodermic.Container = Container;

})(this);

(function (global) {

function DependencyResolver(container) {
	this.container = container;
}

DependencyResolver.prototype = {

	container: null,

	constructor: DependencyResolver,

	findDependency: function(info) {
		var instance = null, factory;

		if (isString(info)) {
			instance = this.container.resolve(info, true);
		}
		else if ("value" in info) {
			instance = info.value;
		}
		else {
			throw new Error("No dependency value found. Missing one of 'id', 'value' or 'factory'");
		}

		return instance;
	},

	injectDependencies: function(instance, config, propertiesSet) {
		if (!config.properties) {
			return;
		}

		var properties = config.properties,
		    key, dependency, setter;

		for (key in properties) {
			if (properties.hasOwnProperty(key) && !propertiesSet[key]) {
				setter = "set" + capitalize(key);
				dependency = this.findDependency(properties[key]);

				if (isFunction(instance[setter])) {
					instance[setter](dependency);
				}
				else {
					instance[key] = dependency;
				}

				propertiesSet[key] = true;
			}
		}
	}

};

global.Hypodermic.DependencyResolver = DependencyResolver;

// utils

var toString = Object.prototype.toString;

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.substring(1, str.length);
}

function isFunction(x) {
	return toString.call(x) === "[object Function]";
}

function isString(x) {
	return toString.call(x) === "[object String]";
}

})(this);

(function(global) {

function ObjectFactory(container, dependencyResolver) {
	this.container = container;
	this.dependencyResolver = dependencyResolver;
}

ObjectFactory.prototype = {

	container: null,

	dependencyResolver: null,

	constructor: ObjectFactory,

	createInstance: function(config, constructorDependencies) {
		if (!config.type) {
			throw new Error("Missing required argument: config.type");
		}

		var Klass = this._getClassReference(config.type),
		    instance = null,
		    args = null;

		if (!Klass) {
			throw new Error("Class " + config.type + " not found.");
		}
		else if (Klass.constructor === Function) {
			instance = Object.create(Klass.prototype);

			if (constructorDependencies) {
				args = this._getConstructorArgs(constructorDependencies);
				Klass.apply(instance, args);
			}
			else {
				Klass.call(instance);
			}
		}
		else {
			// object singleton/static class
			instance = Klass;
		}

		return instance;
	},

	createInstanceFromFactory: function(config) {
		if (!config.factory.id) {
			throw new Error("Missing required argument: config.factory.id");
		}

		var factoryInfo = config.factory,
		    factory = this.container.resolve(factoryInfo.id, true),
		    method = factoryInfo.method || "createInstance",
		    args = [], dependency, i, length;

		if (factoryInfo.args && factoryInfo.args.length) {
			for (i = 0, length = factoryInfo.args.length; i < length; i++) {
				args.push(this.dependencyResolver.findDependency(factoryInfo.args[i]));
			}
		}
		else {
			args.push(factoryInfo.type);
		}

		if (!factory[method]) {
			throw new Error("No method called " + method + " exists on the factory object registered as " + factoryInfo.id);
		}

		dependency = factory[method].apply(factory, args);

		return dependency;
	},

	_getClassReference: function(className) {
		var Klass = _classCache[className] || null;

		if (!Klass && /^[a-zA-Z][\w.$]+$/.test(className)) {
			try {
				Klass = global.eval(className);
			}
			catch (error) {
				Klass = null;
			}
		}

		if (Klass) {
			_classCache[className] = Klass;
		}

		return Klass;
	},

	_getConstructorArgs: function(dependencies) {
		var args = [];

		for (var i = 0, length = dependencies.length; i < length; i++) {
			args.push(this.dependencyResolver.findDependency(dependencies[i]));
		}

		return args;
	}

};

global.Hypodermic.ObjectFactory = ObjectFactory;

// Seed the class cache with some defaults
var _classCache = {};

var conditionalClasses = [
	"Array",
	"Boolean",
	"Date",
	"document",
	"DocumentFragment",
	"DOMParser",
	"Error",
	"FileReader",
	"Function",
	"location",
	"navigator",
	"Number",
	"Object",
	"RegExp",
	"String",
	"XMLHttpRequest"
];

var i, length, x;

for (i = 0, length = conditionalClasses.length; i < length; i++) {
	x = conditionalClasses[i];

	if (global[x] !== undefined) {
		_classCache[x] = global[x];
	}
}

})(this);

(function(g, Module) {

Module.manager = null;

// Make globally available
g.Module = Module;

})(this, this.Module || {});
(function() {

function Factory() {};

Factory.prototype = {

	objectFactory: null,

	constructor: Factory,

	destructor: function destructor() {
		this.objectFactory = null;
	},

	getInstance: function getInstance(type) {
		var instance = null, Klass = null;

		if (this.objectFactory) {
			instance = this.objectFactory.getInstance(type);
		}

		if (!instance) {
			if (/^[a-zA-Z][a-zA-Z0-9.]+[a-zA-Z0-9]$/.test(type)) {
				try {
					Klass = eval(type);
				}
				catch (error) {
					throw new Error("Class name " + type + " does not exist");
				}

				if (!Klass) {
					throw new Error("Class name " + type + " does not exist");
				}
				else if (typeof Klass !== "function") {
					throw new Error("Class name " + type + " is not a constructor function");
				}

				instance = new Klass();
			}
			else {
				throw new Error("Cannot instantiate invalid type: " + type);
			}
		}

		return instance;
	}

};

Module.Factory = Factory;

})();

Module.FrontControllerModuleObserver = function FrontControllerModuleObserver(frontController) {
	this.frontController = frontController || null;
};

Module.FrontControllerModuleObserver.prototype = {

	frontController: null,

	constructor: Module.FrontControllerModuleObserver,

	onModuleCreated: function(module, element, type) {
		module.controllerId = module.controllerId
		                   || module.options.controllerId
		                   || module.guid;
	},

	onModuleRegistered: function(module, type) {
		this.frontController.registerController(module);
	},

	onModuleUnregistered: function(module) {
		this.frontController.unregisterController(module);
	}

};
(function() {

function LazyLoader() {

	// Public Methods

	this.init = init;
	this.destructor = destructor;
	this.setElement = setElement;
	this.setManager = setManager;
	this.setOptions = setOptions;

	// Private Properties

	var self = this,
	    _initialized = false,
	    _options = {
	    	resizeTimeout: 250,
	    	scrollTimeout: 250
	    },
	    _scrollElement =
	    _scrollTimer =
	    _manager =
	    _element =
	    _document =
	    _window =
	    _resizeTimer = null,
	    _scrollLeft =
	    _scrollTop =
	    _viewportHeight =
	    _viewportWidth = 0;

	// Private Methods

	function init() {
		if (_initialized) {
			throw new Error("Cannot re-initialize Module.LazyLoader.");
		}
		else if (!_manager) {
			throw new Error("Missing required property: manager. lazyLoader.setManager(...) to fix this error");
		}
		else if (!_element) {
			throw new Error("Missing required property: element. lazyLoader.setElement(...) to fix this error");
		}

		addEvents();

		initModulesInsideViewport();

		if (!_scrollElement.scrollTop && !_scrollElement.scrollLeft) {
			// Not all browsers agree on the _scrollElement. We are at the
			// top of the page so we don't know whether the browser is
			// scrolling the <html> or <body> tag. Defer judgement until
			// the user has scrolled.
			_scrollElement = null;
		}

		_initialized = true;

		return self;
	}

	function initModulesInsideViewport() {
		var elements = _element.querySelectorAll("[data-module-lazyload]"), i, element;
		var viewport = Viewport.create(getScrollElement());

		for (i = 0; i < elements.length; i++) {
			element = elements[i];

			if (viewport.isVisible(element)) {
				lazyLoadModules(element, "scrollto");
			}
		}
	}

	function lazyLoadModules(element, value) {
		var attr = element.getAttribute("data-module-lazyload");

		if (attr === "any" || new RegExp(value).test(attr)) {
			if (_manager.createModules(element, true).length) {
				element.removeAttribute("data-module-lazyload");
				element.setAttribute("data-module-lazyloaded", attr);
			}
		}

		element = null;
	}

	function destructor() {
		if (_element) {
			removeEvents();
			_element = _document = _scrollElement = _window = null;
		}

		if (_scrollTimer) {
			clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		if (_resizeTimer) {
			clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		_manager = _options.scrollElement = _options = self = null;
	}

	function addEvent(element, name, listener) {
		if (name === "resize") {
			listener.oldresize = element.onresize || null;
			element.onresize = listener;
		}
		else if (element.addEventListener) {
			element.addEventListener(name, listener, true);
		}
		else if (name === "scroll") {
			element.onscroll = listener;
		}
		else {
			element.attachEvent("on" + name, listener);
		}
	}

	function addEvents() {
		addEvent(_element, "mouseover", handleMouseOverEvent);
		addEvent(_document, "scroll", handleScrollEvent);
		addEvent(_window, "resize", handleResizeEvent);
	}

	function getScrollElement() {
		if (_scrollElement === null) {
			if (_document.body.scrollTop || _document.body.scrollLeft) {
				_scrollElement = _document.body;
			}
			else {
				_scrollElement = _document.documentElement;
			}
		}

		return _scrollElement;
	}

	function handleMouseOverEvent(event) {
		event = event || window.event;
		event.target = event.target || event.srcElement;

		if (event.target.getAttribute("data-module-lazyload")) {
			lazyLoadModules(event.target, event.type);
		}
	}

	function handleScrollEvent(event) {
		removeEvent(_document, "scroll", handleScrollEvent);

		if (_scrollTimer) {
			clearInterval(_scrollTimer);
		}

		_scrollTimer = setInterval(checkScrollPosition, _options.scrollTimeout);
	}

	function checkScrollPosition() {
		var scrollElement = getScrollElement(),
		    newScrollLeft = scrollElement.scrollLeft,
		    newScrollTop = scrollElement.scrollTop;

		if (newScrollLeft != _scrollLeft || newScrollTop != _scrollTop) {
			clearInterval(_scrollTimer);
			addEvent(_document, "scroll", handleScrollEvent);
			_scrollLeft = newScrollLeft;
			_scrollTop = newScrollTop;
			initModulesInsideViewport();
		}
	}

	function handleResizeEvent(event) {
		removeEvent(_window, "resize", handleResizeEvent);

		if (_resizeTimer) {
			clearInterval(_resizeTimer);
		}

		_resizeTimer = setInterval(checkViewportSize, _options.resizeTimeout);
	}

	function checkViewportSize() {
		var newHeight = _document.documentElement.clientHeight,
		    newWidth = _document.documentElement.clientWidth;

		if (newWidth !== _viewportWidth || newHeight !== _viewportHeight) {
			clearInterval(_resizeTimer);
			addEvent(_window, "resize", handleResizeEvent);
			_viewportHeight = newHeight;
			_viewportWidth = newWidth;
			initModulesInsideViewport();
		}
	}

	function removeEvent(element, name, listener) {
		if (name === "resize") {
			element.onresize = listener.oldresize || null;
			listener.oldresize = null;
		}
		else if (element.removeEventListener) {
			element.removeEventListener(name, listener, true);
		}
		else if (name === "scroll") {
			element.onscroll = null;
		}
		else {
			element.detachEvent("on" + name, listener);
		}
	}

	function removeEvents() {
		removeEvent(_element, "mouseover", handleMouseOverEvent);
		removeEvent(_document, "scroll", handleScrollEvent);
		removeEvent(_window, "resize", handleResizeEvent);
	}

	function setElement(element) {
		_element = element;
		_document = _element.ownerDocument;
	    _window = _document.defaultView;

		element = null;

		return self;
	}

	function setManager(manager) {
		_manager = manager;
		manager = null;
		return self;
	}

	function setOptions(overrides) {
		if (overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					_options[key] = overrides[key];
				}
			}
		}

		overrides = null;

		return self;
	}

}

// Internal class for viewport calculations
function Viewport() {}

Viewport.prototype = {
	bottom: 0,
	height: 0,
	left: 0,
	right: 0,
	top: 0,
	width: 0,

	constructor: Viewport,

	isBottomInBounds: function isBottomInBounds(position) {
		return (position.top + position.height <= this.top + this.height && position.top + position.height > this.top) ? true : false;
	},

	isLeftInBounds: function isLeftInBounds(position) {
		return (position.left >= this.left && position.left < this.left + this.width) ? true : false;
	},

	isRightInBounds: function isRightInBounds(position) {
		return (position.left + position.width <= this.left + this.width && position.left + position.width > this.left) ? true : false;
	},

	isTopInBounds: function isTopInBounds(position) {
		return (position.top >= this.top && position.top < this.top + this.height) ? true : false;
	},

	isVisible: function isVisible(element) {
		var visible = false;
		var position = this._getPosition(element);

		if ((this.isRightInBounds(position) || this.isLeftInBounds(position)) && (this.isTopInBounds(position) || this.isBottomInBounds(position))) {
			visible = true;
		}

		return visible;
	},

	_getPosition: function _getPosition(element) {
		var parent = element.offsetParent;
		var position = {
			top: element.offsetTop,
			left: element.offsetLeft,
			width: element.offsetWidth,
			height: element.offsetHeight
		};

		while(parent = parent.offsetParent) {
			position.top += parent.offsetTop;
			position.left += parent.offsetLeft;
		}

		return position;
	}
};

Viewport.create = function create(element) {
	var viewport = new this();

	viewport.top = element.scrollTop;
	viewport.left = element.scrollLeft;
	viewport.width = element.clientWidth;
	viewport.height = element.clientHeight;
	viewport.right = element.offsetWidth - (viewport.left + viewport.width);
	viewport.bottom = element.offsetHeight - viewport.top - viewport.height;

	return viewport;
};

Module.LazyLoader = LazyLoader;

})();

(function() {

function Manager() {};

Manager.prototype = {

	baseClassName: "module",

	defaultModule: null,

	defaultModuleFocused: false,

	moduleObserver: {
		onModuleCreated: function(module, element, type) {},
		onModuleRegistered: function(module, type) {},
		onModuleUnregistered: function(module) {}
	},

	provider: null,

	registry: null,

	groups: null,

	constructor: Module.Manager,

	destructor: function destructor(cascadeDestroy) {
		if (Module.manager === this) {
			Module.manager = null;
		}

		if (this.registry) {
			this._destroyRegistry(cascadeDestroy);
		}

		if (this.groups) {
			this._destroyGroups();
		}

		if (this.provider) {
			if (cascadeDestroy) {
				this.provider.destructor();
			}

			this.provider = null;
		}

		if (this.lazyLoader) {
			this.lazyLoader.destructor();
			this.lazyLoader = null;
		}
	},

	_destroyGroups: function _destroyGroups() {
		var key, group, i, length;

		for (key in this.groups) {
			if (this.groups.hasOwnProperty(key)) {
				group = this.groups[key];

				for (i = 0, length = group.length; i < length; i++) {
					group[i] = null;
				}

				this.groups[key] = null;
			}
		}

		this.groups = null;
	},

	_destroyRegistry: function _destroyRegistry(cascadeDestroy) {
		var key, entry;

		for (key in this.registry) {
			if (this.registry.hasOwnProperty(key)) {
				entry = this.registry[key];
				this.moduleObserver.onModuleUnregistered(entry.module);

				if (cascadeDestroy) {
					entry.module.destructor(true);
				}

				entry.module = null;
				this.registry[key] = null;
			}
		}

		this.registry = null;
	},

	init: function init() {
		this.provider = this.provider || new Module.Provider();
		this.provider.factory = this.provider.factory || new Module.Factory();
		this.provider.manager = this;
		this.provider.moduleObserver = this.moduleObserver;
		this.registry = this.registry || {};
		this.groups = this.groups || {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function eagerLoadModules(element) {
		var els = element.querySelectorAll("[data-modules]"),
			i = 0;

		for (i; i < els.length; i++) {
			this.createModules(els[i]);
		}

		els = null;

		return this;
	},

	lazyLoadModules: function lazyLoadModules(element, options) {
		this.lazyLoader = (this.lazyLoader || new Module.LazyLoader())
			.setManager(this)
			.setElement(element)
			.setOptions(options)
			.init();

		element = options = null;

		return this;
	},

	createModule: function createModule(element, type, options, register) {
		var module = this.provider.createModule(element, type, options);

		if (register) {
			this.registerModule(type, module);
		}

		element = options = null;

		return module;
	},

	createModules: function createModules(element, lazyLoad) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}
		else if (!lazyLoad && element.getAttribute("data-module-lazyload")) {
			return [];
		}
		else if (element.getAttribute("data-module-property")) {
			return [];
		}

		var metaData = new Module.MetaData(element),
		    modules = [];

		if (metaData.mediaMatches()) {
			this.provider.createModules(metaData, function(module, element, type, options) {
				modules.push(module);
				this.registerModule(type, module);
				module.init();
			}, this);

			this.markModulesCreated(element, metaData);
		}

		metaData = element = null;

		return modules;
	},

	focusDefaultModule: function focusDefaultModule(anything) {
		if (this.defaultModule && !this.defaultModuleFocused) {
			this.defaultModuleFocused = true;
			this.defaultModule.focus(anything);
		}
	},

	initModuleInContainer: function initModuleInContainer(element, container, config, template, type, module) {
		var createdAt = new Date();
		var renderData = {
			guid: module.guid,
			createdAt: createdAt,
			timestamp: createdAt.getTime(),
			controllerId: module.controllerId
		}, key;

		if (config.renderData) {
			for (key in config.renderData) {
				if (config.renderData.hasOwnProperty(key)) {
					renderData[key] = config.renderData[key];
				}
			}
		}

		var html = template.innerHTML.replace(/#\{([-.\w]+)\}/g, function(match, key) {
			return renderData[key] || "";
		});

		element.className += (" " + this.baseClassName + " " + config.className).replace(/\s{2,}/g, " ");
		element.innerHTML = html;

		if (config.insert === "top" && container.firstChild) {
			container.insertBefore(element, container.firstChild);
		}
		else {
			container.appendChild(element);
		}

		this.registerModule(type, module);
		module.init();

		if (config.autoFocus) {
			module.focus(!!config.autoFocusAnything);
		}
	},

	markModulesCreated: function markModulesCreated(element, metaData) {
		element.setAttribute("data-modules-created", metaData.types.join(" "));
		element.removeAttribute("data-modules");
		element = metaData = null;
	},

	registerModule: function registerModule(type, module) {
		if (module.guid === undefined || module.guid === null) {
			throw new Error("Cannot register module " + type + " without a guid property");
		}
		else if (this.registry[module.guid]) {
			throw new Error("Module " + module.guid + " has already been registered");
		}

		this.registry[module.guid] = {module: module, type: type};

		if (!this.groups[type]) {
			this.groups[type] = [];
		}

		this.groups[type].push(module);
		this.moduleObserver.onModuleRegistered(module, type);

		module = null;
	},

	unregisterModule: function unregisterModule(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return false;
		}

		var guid = module.guid,
		    type = this.registry[guid].type,
		    group = this.groups[type],
		    unregistered = false;

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					unregistered = true;
					this.moduleObserver.onModuleUnregistered(module);
					break;
				}
			}
		}

		module = group = null;

		return unregistered;
	},

	setDefaultModule: function setDefaultModule(module) {
		if (!this.defaultModule) {
			this.defaultModule = module;
		}

		module = null;
	}

};

Module.Manager = Manager;

})();

(function(g) {

	function MetaData(element) {
		this.options = null;
		this.types = [];

		if (element) {
			this.setElement(element);
		}
	}

	MetaData.prototype = {

		element: null,

		media: null,

		options: null,

		types: null,

		constructor: MetaData,

		forEach: function forEach(callback, context) {
			var i = 0, length = this.types.length,
			    result, type, options;

			if (length === 1) {
				callback.call(context, this.element, this.types[0], this.options, 0, this);
			}
			else {
				for (i; i < length; ++i) {
					type = this.types[i];
					options = this.options[type] || {};
					result = callback.call(context, this.element, type, options, i, this);

					if (result === false) {
						break;
					}
				}
			}
		},

		mediaMatches: function mediaMatches() {
			if (!g.matchMedia) {
				throw new Error("This browser does not support JavaScript media queries. Please include a polyfill (https://github.com/paulirish/matchMedia.js)");
			}

			if (this.media)
				console.info("Match media: " + this.media, g.matchMedia(this.media).matches);

			return this.media === null || g.matchMedia(this.media).matches;
		},

		setElement: function setElement(element) {
			this.element = element;

			var types = element.getAttribute("data-modules"),
			    options = element.getAttribute("data-module-options");

			if (!types) {
				throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
			}

			this.types = types
				.replace(/^\s+|\s+$/g, "")
				.split(/\s+/g);

			this.options = options ? JSON.parse(options) : {};
			this.media = element.getAttribute("data-module-media");
		}

	};

	g.Module.MetaData = MetaData;

})(this);

(function() {

function Provider() {}

Provider.prototype = {

	factory: null,

	manager: null,

	moduleObserver: null,

	subModulesEnabled: true,

	constructor: Provider,

	destructor: function destructor(cascadeDestroy) {
		if (cascadeDestroy && this.factory) {
			this.factory.destructor();
		}

		this.factory = this.manager = null;
	},

	_createModuleClass: function _createModuleClass(type) {
		return "module " + type.charAt(0).toLowerCase() + type.slice(1, type.length)
			.replace(/(\.[A-Z])/g, function(match, $1) {
				return "-" + $1.replace(/\./g, "").toLowerCase();
			})
			.replace(/Module$/, "")
			.replace(/^\s+|\s+$/g, "");
	},

	createModule: function createModule(element, type, options) {
		var module = this.factory.getInstance(type);
		var className = this._createModuleClass(type);

		element.className += element.className ? " " + className : className;

		module.setElement(element);
		module.setOptions(options);

		if (options.defaultModule) {
			this.manager.setDefaultModule(module);
		}

		this.moduleObserver.onModuleCreated(module, element, type);

		if (this.subModulesEnabled && !options.subModulesDisabled) {
			this._createSubModules(module);
		}

		return module;
	},

	createModules: function createModule(metaData, callback, context) {
		var modules = [],
		    module,
		    callback = callback || function() {};

		metaData.forEach(function(element, type, options) {
			module = this.createModule(element, type, options);
			modules.push(module);
			callback.call(context, module, element, type, options);
		}, this);

		callback = context = module = null;

		return modules;
	},

	_createSubModules: function _createSubModules(module) {
		var els = module.element.getElementsByTagName("*"),
		    length = els.length,
		    i = 0, element, name;

		for (i; i < length; i++) {
			element = els[i];
			name = element.getAttribute("data-module-property");

			if (name) {
				this._createSubModuleProperty(module, name, element);
			}
		}
	},

	_createSubModuleProperty: function _createSubModuleProperty(parentModule, name, element) {
		var metaData = new Module.MetaData(element),
		   subModule;

		if (metaData.types.length > 1) {
			throw new Error("Sub module elements cannot have more than one type specified in data-modules");
		}

		subModule = this.createModule(element, metaData.types[0], metaData.options);
		subModule.init();

		if (parentModule[name] === null) {
			parentModule[name] = subModule;
		}
		else if (parentModule[name] instanceof Array) {
			if (!parentModule.hasOwnProperty(name)) {
				parentModule[name] = [];
			}

			parentModule[name].push(subModule);
		}
		else {
			throw new Error("Cannot create sub module property '" + name + "'. Property is neither null nor an Array on the parent module.");
		}

		this.manager.markModulesCreated(element, metaData);

		subModule = metaData = element = null;
	}

};

Module.Provider = Provider;

})();

(function(g, Module) {

var _guid = 0;

function Base() {
	this.initialize();
}

Base.setDefaultModule = function(module) {
	Module.manager.setDefaultModule(module);
};

Base.unregister = function(module) {
	if (!Module.manager) {
		return;
	}

	Module.manager.unregisterModule(module);
};

Base.prototype = {

	controllerId: null,

	document: null,

	element: null,

	guid: null,

	_isLoading: false,

	window: null,

	constructor: Base,

	initialize: function() {
		this.guid = ++_guid;
		this.options = {};
	},

	init: function(elementOrId, options) {
		if (elementOrId) {
			this.setElement(elementOrId);
		}

		if (options) {
			this.setOptions(options);
		}

		if (this.options.defaultModule) {
			Base.setDefaultModule(this);
		}

		return this;
	},

	destructor: function(keepElement) {
		Base.unregister(this);

		if (!keepElement && this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}

		this.element = this.options = this.document = this.window = null;
	},

	focus: function(anything) {
		var element,
			typeRegex = /checkbox|radio|submit|button|image|reset/,
		    selector = [
		    	"textarea",
		    	"select",
		    	"input[type=text]",
		    	"input[type=password]",
		    	"input[type=checkbox]",
		    	"input[type=radio]",
		    	"input[type=email]",
		    	"input[type=number]",
		    	"input[type=search]",
		    	"input[type=url]"
		    ];

		if (anything) {
			selector.push(
				"a",
				"button",
				"input[type=submit]",
				"input[type=button]",
				"input[type=image]",
				"input[type=reset]"
			);
		}

		element = this.element.querySelector(selector.join(", "));

		if (element && element.focus) {
			element.focus();

			if (element.select && !typeRegex.test(element.type)) {
				element.select();
			}
		}

		element = null;
	},

	_loading: function(element) {
		(element || this.element).classList.add("loading");
		this._isLoading = true;
		element = null;
	},

	_loaded: function(element) {
		(element || this.element).classList.remove("loading");
		this._isLoading = false;
		element = null;
	},

	onControllerRegistered: function(frontController, controllerId) {
	},

	onControllerUnregistered: function(frontController) {
	},

	setElement: function(elementOrId) {
		this.element = typeof elementOrId === "string"
		             ? document.getElementById(elementOrId)
		             : elementOrId;

		if (!this.element) {
			throw new Error("Could not find element: " + elementOrId);
		}

		this.document = this.element.ownerDocument;
		this.window = this.document.defaultView || this.document.parentWindow;
	},

	setOptions: function(overrides) {
		for (var key in overrides) {
			if (overrides.hasOwnProperty(key)) {
				this.options[key] = overrides[key];
			}
		}

		overrides = null;
	}

};

Module.Base = Base;

// Make globally available
g.Module = Module;

})(this, this.Module || {});
Module.Utils = {
	include: function(mixin) {
		if (Module.Base)
			Module.Base.include(mixin);
	}
};

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

Module.Utils.Events = {
	included: function(Klass) {
		Beacon.setup(Klass);
		Klass.addCallback("beforeReady", "_initApplicationEvents");
	}
};

Module.Utils.include(Module.Utils.Events);

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

var Foundry = {
	version: "0.1.1"
};

Foundry.run = function(callback) {
	callback = callback || function() {};

	var config = {
		application: {
			type: "Foundry.Application",
			singleton: true,
			properties: {
				container: "container",
				dispatcher: "eventDispatcher",
				frontController: "frontController",
				moduleManager: "moduleManager"
			}
		},
		frontController: {
			type: "Oxydizr.FrontController",
			singleton: true
		},
		eventDispatcher: {
			type: "Beacon.Dispatcher",
			singleton: true
		},
		objectFactory: {
			type: "Foundry.ModuleFactory",
			singleton: true,
			properties: {
				container: "container"
			}
		},
		moduleFactory: {
			type: "Module.Factory",
			singleton: true,
			properties: {
				objectFactory: "objectFactory"
			}
		},
		moduleProvider: {
			type: "Module.Provider",
			singleton: true,
			properties: {
				factory: "moduleFactory"
			}
		},
		moduleManager: {
			type: "Module.Manager",
			singleton: true,
			properties: {
				provider: "moduleProvider",
				moduleObserver: "moduleObserver"
			}
		},
		moduleObserver: {
			type: "Module.FrontControllerModuleObserver",
			properties: {
				frontController: "frontController"
			}
		},
		module: {
			abstract: true,
			properties: {
				elementStore: "elementStore",
				eventDispatcher: "eventDispatcher"
			}
		},
		elementStore: {
			type: "ElementStore"
		},
		merge: function(overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					this[key] = overrides[key];
				}
			}

			return this;
		}
	};

	var options = { autoInit: true },
	    element = callback(config, options) || document.documentElement,
	    container = new Hypodermic.Container(config),
	    app = container.resolve("application");

	if (options.autoInit) {
		app.init(element, options);
	}
	else {
		app.setElement(element);
		app.setOptions(options);
	}

	return app;
};

Foundry.Application = function() {
	this.options = {
		eagerLoadModules: true,
		focusAnythingInDefaultModule: false,
		handleActionErrors: true,
		handleApplicationErrors: true,
		lazyLoadModules: false,
		subModulesDisabled: false
	};
};

Foundry.Application.prototype = {

	dispatcher: null,

	document: null,

	element: null,

	errorHandler: null,

	eventsController: null,

	frontController: null,

	moduleManager: null,

	newModuleController: null,

	options: null,

	window: null,

	constructor: Foundry.Application,

	init: function(element, options) {
		if (element) {
			this.setElement(element);
		}

		if (options) {
			this.setOptions(options);
		}

		this._initErrorHandling();

		try {
			this.frontController.init(this.element);
			this._initEventsController();
			this._initNewModuleController();
			this._initModuleManager();
			this.dispatcher.publish("application.ready", this);
		}
		catch (error) {
			if (!this.errorHandler || !this.errorHandler.handleError(error)) {
				throw error;
			}
		}

		return this;
	},

	_initErrorHandling: function() {
		if (this.options.handleApplicationErrors) {
			this.errorHandler = this.errorHandler || new Foundry.ErrorHandler();
			this.errorHandler.init(this, this.window);

			if (!this.frontController.errorHandler && this.options.handleActionErrors) {
				this.frontController.errorHandler = this.errorHandler;
			}
		}
	},

	_initEventsController: function() {
		this.eventsController = this.eventsController || new Foundry.ApplicationEventsController(this.dispatcher);
		this.frontController.registerController(this.eventsController);
	},

	_initModuleManager: function() {
		this.moduleManager.init();

		if (this.options.eagerLoadModules) {
			this.moduleManager.eagerLoadModules(this.element);
		}

		if (this.options.lazyLoadModules) {
			this.moduleManager.lazyLoadModules(this.element);
		}

		this.moduleManager.focusDefaultModule(this.options.focusAnythingInDefaultModule);
	},

	_initNewModuleController: function() {
		var newModuleController = this.newModuleController || new Foundry.NewModuleController();
		newModuleController.dispatcher = this.dispatcher;
		newModuleController.document = this.document;
		newModuleController.frontController = this.frontController;
		newModuleController.moduleManager = this.moduleManager;
		newModuleController.init();
		this.newModuleController = newModuleController
	},

	destructor: function() {
		this.dispatcher.publish("application.destroy", this);
		this.moduleManager.destructor(true);
		this.errorHandler.destructor();
		this.eventsController.destructor();
		this.newModuleController.destructor();
		this.frontController.destructor();
		this.dispatcher.destructor();

		this.newModuleController =
		this.eventsController =
		this.dispatcher =
		this.frontController =
		this.moduleManager =
		this.errorHandler =
		this.element =
		this.document =
		this.window =
		this.logger =
		this.options = null;
	},

	setElement: function(element) {
		this.element = element;
		this.document = element.ownerDocument;
		this.window = this.document.defaultView;
	},

	setOptions: function(options) {
		for (var key in options) {
			if (options.hasOwnProperty(key)) {
				this.options[key] = options[key];
			}
		}
	}

};

Foundry.ApplicationEventsController = function(dispatcher) {
	this.dispatcher = dispatcher;
};

Foundry.ApplicationEventsController.prototype = {

	controllerId: "events",

	dispatcher: null,

	frontController: null,

	constructor: Foundry.ApplicationEventsController,

	destructor: function() {
		if (this.frontController) {
			this.frontController.unregisterController(this);
		}

		this.dispatcher = this.frontController = null;
	},

	onControllerRegistered: function(frontController, controllerId) {
		this.frontController = frontController;
	},

	onControllerUnregistered: function(frontController) {
	},

	/**
	 * Application#publishEvent(event, element, params)
	 * - event (Event): The browser event object.
	 * - element (HTMLElement): The HTML element with the data-action attribute.
	 * - params (Object): Action params.
	 * - params.event (String): Required name of the application event to publish.
	 * - params.data (Object): Optional data to pass along in the event.
	 *
	 * Publish an event on the global event dispatcher, triggered by a user action,
	 * such as a click. The element is passed along as the publisher of the event,
	 * and arbitrary data is passed along via the params.data property.
	 **/
	publishEvent: function click(event, element, params) {
		if (!params.event) {
			throw new Error("Missing required argument params.event");
		}

		event.stop();
		this.dispatcher.publish(params.event, element, params.data || {});
	}

};
Foundry.ErrorHandler = function() {
};

Foundry.ErrorHandler.prototype = {

	application: null,

	logger: window.console || null,

	window: null,

	constructor: Foundry.ErrorHandler,

	destructor: function() {
		if (this.window) {
			this.window.onerror = null;
		}

		this.application = this.logger = this.window = null;
	},

	init: function(application, window) {
		this.application = application;
		this.window = window;
		this.window.onerror = this.handleError.bind(this);
	},

	_getErrorObject: function(errorMessage) {
		var info = errorMessage.match(/^(([A-Za-z_][A-Za-z0-9._]*):)?(.+$)/),
		    error = null, className, message, Klass;

		if (!info) {
			error = new Error(message);
		}
		else {
			className = info[2] || "Error";
			message = (info[3] || errorMessage).replace(/^\s+|\s+$/g, "");

			if (/^[A-Za-z_][A-Za-z0-9._]*$/.test(className)) {
				try {
					Klass = eval(className);
					error = new Klass(message);
				}
				catch (error) {
					throw new Error("Class '" + className + "' is either not found or not an object constructor function");
				}
			}
			else {
				error = new Error(message);
			}
		}

		return error;
	},

	handleActionError: function(error, event, element, params, action, controller, controllerId) {
		if (this.logger) {
			this.logger.error(error);

			this.logger.debug({
				error: error,
				event: event,
				element: element,
				params: params,
				action: action,
				controller: controller,
				controllerId: controllerId
			});
		}
		else {
			throw error;
		}
	},

	handleError: function(errorMessage) {
		var error = typeof errorMessage === "string" ? this._getErrorObject(errorMessage) : errorMessage;

		return this._handleError(error);
	},

	_handleError: function(error) {
		if (this.logger) {
			this.logger.error(error);

			return true;
		}

		return false;
	}

};

Foundry.ModuleFactory = function ModuleFactory() {
}

Foundry.ModuleFactory.prototype = {

	container: null,

	constructor: Foundry.ModuleFactory,

	destructor: function() {
		this.container = null;
	},

	getInstance: function(type) {
		return this.container.resolve(type);
	}

};

Foundry.ModuleObserver = function(frontController) {
	this.frontController = frontController || null;
};

Foundry.ModuleObserver.prototype = {

	frontController: null,

	constructor: Foundry.ModuleObserver,

	destructor: function() {
		this.frontController = null;
	},

	onModuleCreated: function(module, element, type) {
		module.controllerId = module.options.controllerId || module.guid;
	},

	onModuleRegistered: function(module, type) {
		this.frontController.registerController(module);
	},

	onModuleUnregistered: function(module) {
		this.frontController.unregisterController(module);
	}

};

Foundry.NewModuleController = function() {};

Foundry.NewModuleController.prototype = {

	controllerId: "newModules",

	dispatcher: null,

	document: null,

	frontController: null,

	moduleManager: null,

	constructor: Foundry.NewModuleController,

	destructor: function() {
		if (this.dispatcher) {
			this.dispatcher.unsubscribe(this);
		}

		if (this.frontController) {
			this.frontController.unregisterController(this);
		}

		this.dispatcher = this.document = this.moduleManager = this.frontController = null;
	},

	init: function() {
		this.dispatcher.subscribe(this.controllerId + ".createModule", this, "handleCreateModule");
		this.frontController.registerController(this);
	},

	/**
	 * Application#createModule(event, element, params)
	 * - event (Event): The browser event object
	 * - element (HTMLElement): The HTML element with the data-action attribute on it.
	 * - params (Object): Action params used to create the new module.
	 *
	 * Creates a new module on the page triggered by a user event. The
	 * new module is created, including its root element, and appended
	 * to a container on the page.
	 **/
	createModule: function click(event, element, params) {
		event.stop();
		this._createModuleFromConfig(params);
		event = element = params = null;
	},

	/**
	 * Application#_createModuleFromConfig(config) -> Module
	 * - config (Object): New module config.
	 * - config.module (Object): Required meta data about the new module to create.
	 * - config.module.type (String): Type or class name of the new module.
	 * - config.module.options (Object): Optional options hash to pass in to the new module's init() method.
	 * - config.module.template (String): Name of the client side template used to render this new module.
	 *
	 * - config.container (Object): Optional meta data about the HTML element that will contain this new module.
	 * - config.container.selector (String): The optional CSS selector identifying the container. Defaults to the <body> tag.
	 * - config.container.insert (String): Values (top|bottom). Determines where the new root element for this module will
	 *                                     be inserted into the container.
	 *
	 * - config.element (Object): Optional meta data about the root element for this new module.
	 * - config.element.tag (String): Optional name of the HTML tag to create. Defaults to "div".
	 * - config.element.className (String): The optional class name for the new root element. Multiple class names are
	 *                                      separated by a space character.
	 *
	 * Create a new module on the page and append it to a container.
	 **/
	_createModuleFromConfig: function(config) {
		if (!config.module) {
			throw new Error("Missing required config.module");
		}
		else if (!config.module.type) {
			throw new Error("Missing required config.module.type");
		}
		else if (!config.module.template) {
			throw new Error("Missing required config.module.template for type: " + config.module.type);
		}

		config.module.options = config.module.options || {};
		config.container = config.container || {};
		config.container.insert = config.container.insert || "top";
		config.element = config.element || {};
		config.element.tag = config.element.tag || "div";

		var module = null;
		var container = null;
		var selector = "script[data-template=" + config.module.template + "]";
		var template = this.document.querySelector(selector);
		var element = this.document.createElement(config.element.tag);

		if (!template) {
			throw new Error("Failed to find new module template using selector: " + selector);
		}

		if (config.container.selector) {
			container = this.document.querySelector(config.container.selector);
		}
		else {
			container = this.document.getElementsByTagName("body")[0];
		}

		if (!container) {
			throw new Error("Failed to find module container with selector: " + (config.container.selector || "body"));
		}

		module = this.moduleManager.createModule(element, config.module.type, config.module.options || {});
		this.moduleManager.initModuleInContainer(element, container, config.container, template, config.module.type, module);
		module.focus();

		element = template = config = container = null;

		return module;
	},

	handleCreateModule: function(event) {
		this._createModuleFromConfig(event.data);

		return false;
	},

	onControllerRegistered: function(frontController, controllerId) {
	},

	onControllerUnregistered: function(frontController) {
	}

};