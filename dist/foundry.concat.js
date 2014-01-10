/*! foundry 2014-01-10 */
(function() {

	var _isMSIE = (/msie/i).test(navigator.userAgent);

	function include(mixin) {
		var key;

		// include class level methods
		if (mixin.self) {
			for (key in mixin.self) {
				if (mixin.self.hasOwnProperty(key) && !this[key]) {
					this[key] = mixin.self[key];
				}
			}
		}

		// include instance level methods
		if (mixin.prototype) {
			for (key in mixin.prototype) {
				if (mixin.prototype.hasOwnProperty(key) && !this.prototype[key]) {
					this.prototype[key] = mixin.prototype[key];
				}
			}
		}

		// include other mixins
		if (mixin.includes) {
			mixin.includes = (mixin.includes instanceof Array) ? mixin.includes : [mixin.includes];

			for (var i = 0, length = mixin.includes.length; i < length; i++) {
				this.include(mixin.includes[i]);
			}
		}

		if (mixin.included) {
			mixin.included(this);
		}

		mixin = null;
	}

	function extend(descriptor) {
		descriptor = descriptor || {};
		var key, i, length;

		// Constructor function for our new class
		var Klass;

		if (_isMSIE) {
			Klass = function() {
				// MSIE does not set the __proto__ property automatically, so we must do it at runtime
				//if (!this.hasOwnProperty("__proto__")) {
					this.__proto__ = Klass.prototype;
				//}

				if (!Klass.__inheriting) {
					this.initialize.apply(this, arguments);
				}
			};
		}
		else {
			// All other browsers play nice.
			Klass = function() {
				if (!Klass.__inheriting) {
					this.initialize.apply(this, arguments);
				}
			};
		}

		// Flag to prevent calling Klass#initialize when setting up the inheritance chain.
		Klass.__inheriting = false;

		// "inherit" class level methods
		for (key in this) {
			if (this.hasOwnProperty(key)) {
				Klass[key] = this[key];
			}
		}

		// new class level methods
		if (descriptor.self) {
			for (key in descriptor.self) {
				if (descriptor.self.hasOwnProperty(key)) {
					Klass[key] = descriptor.self[key];
				}
			}
		}

		// Set up true prototypal inheritance for ECMAScript compatible browsers
		try {
			this.__inheriting = true;     // Set the flag indicating we are inheriting from the parent class
			Klass.prototype = new this(); // The "new" operator generates a new prototype object, setting the __proto__ property all browsers except MSIE
			this.__inheriting = false;    // Unset the inheriting flag
		}
		catch (error) {
			this.__inheriting = false;    // Oops! Something catestrophic went wrong during inheriting. Unset the inheritance flag
			throw error;                  // Throw the error. Let the developer fix this.
		}

		// new instance level methods
		if (_isMSIE) {
			// MSIE does not set the __proto__ property so we forefully set it here.
			Klass.prototype.__proto__ = this.prototype;
		}

		// new instance level methods
		if (descriptor.prototype) {
			for (key in descriptor.prototype) {
				if (descriptor.prototype.hasOwnProperty(key)) {
					Klass.prototype[key] = descriptor.prototype[key];
				}
			}
		}

		// apply mixins
		if (descriptor.includes) {
			// force includes to be an array
			descriptor.includes = (descriptor.includes instanceof Array) ? descriptor.includes : [descriptor.includes];

			for (i = 0, length = descriptor.includes.length; i < length; i++) {
				Klass.include(descriptor.includes[i]);
			}
		}

		// ensure new prototype has an initialize method
		Klass.prototype.initialize = Klass.prototype.initialize || function() {};

		// set reference to constructor function in new prototype
		Klass.prototype.constructor = Klass;

		descriptor = null;

		return Klass;
	}

	// Make "include" available to the World
	if (!Function.prototype.include) {
		Function.prototype.include = include;
	}

	// Make "extend" available to the World
	if (!Function.prototype.extend) {
		if (Object.extend) {
			// Some JavaScript libraries already have an "extend" function
			Object._extend = extend;
		}

		Function.prototype.extend = extend;
	}

})();


var Cerealizer = {

	_instances: {},

	objectFactory: null,

	_types: {},

	getInstance: function(name) {
		if (this._types[name]) {
			if (!this._instances[name]) {
				var instance;

				if (this.objectFactory) {
					instance = this.objectFactory.getInstance(name);

					if (!instance) {
						throw new Error("Could not get serializer instance from object factory for type: " + name);
					}
				}
				else {
					instance = new this._types[name]();
				}

				this._instances[name] = instance;
			}

			return this._instances[name];
		}
		else {
			throw new Error("Cannot get instance for unregistered type: " + name);
		}
	},

	registerType: function(klass, names) {
		for (var i = 0, length = names.length; i < length; i++) {
			this._types[ names[i] ] = klass;
		}
	}

};

Cerealizer.Json = function Json() {};

Cerealizer.Json.prototype = {

	constructor: Cerealizer.Json,

	regex: /^[{\[]].*[}\]]$/g,

	deserialize: function(str) {
		return JSON.parse(str);
	},

	serialize: function(data) {
		return JSON.stringify(data);
	},

	test: function(str) {
		return this.regex.test(str);
	},

	toString: function() {
		return "[object Cerealizer.Json]";
	}

};

if (!window.JSON) {
	throw new Error("No native JSON parser was found. Consider using JSON2.js (https://github.com/douglascrockford/JSON-js)");
}

Cerealizer.registerType(Cerealizer.Json, [
	"json",
	"text/json",
	"application/json"
]);

Cerealizer.QueryString = function QueryString() {};

Cerealizer.QueryString.prototype = {

	constructor: Cerealizer.QueryString,

	hashNotation: true,

	keysRegex: /[\[\].]+/,

	pairsRegex: /([^=&]+)=([^&]+)/g,

	regex: /([^=&]+)=([^&]+)/,

	_convert: function(s) {
		s = typeof s === "string" ? unescape(s) : s;

		if (/^[-+0-9.]+$/.test(s) && !isNaN(s)) {
			return Number(s);
		}
		else if (/^(true|false)$/.test(s)) {
			return s === "true";
		}
		else if (s === "NaN") {
			return NaN;
		}
		else {
			return s;
		}
	},

	_convertAndHydrate: function(data, key, value) {
		value = this._convert(unescape(value));

		if (this._isValid(value)) {
			keys = key
				.replace(/]$/, "")
				.split(this.keysRegex);

			this._hydrate(data, keys, value);
		}
	},

	deserialize: function(str) {
		var that = this;
		var data = {};
		var keys, values;

		str.replace(/^\?/, "").replace(this.pairsRegex, function(match, key, value) {
			if (/\[\]/.test(key)) {
				throw new Error("Cannot deserialize keys with empty array notation: " + key);
			}

			that._convertAndHydrate(data, key, value);
		});

		return data;
	},

	_hydrate: function(data, keys, value) {
		var currData = data,
		    key, i = 0,
		    length = keys.length - 1,
		    lastKey = unescape( keys[ keys.length - 1 ] );

		// Find the object we want to set the value on
		for (i; i < length; i++) {
			key = unescape(keys[i]);

			if (!currData.hasOwnProperty(key)) {
				currData[key] = {};
			}

			currData = currData[key];
		}

		currData[lastKey] = value;
		currData = keys = null;

		return data;
	},

	_isValid: function(value) {
		if (value === null || value === undefined) {
			return false;
		}
		else {
			var t = typeof(value);

			if (t === "number") {
				return !isNaN(value);
			}
			else {
				return (t === "string" || t === "boolean") ? true : false;
			}
		}
	},

	_isObject: function(x) {
		return Object.prototype.toString.call(x) === "[object Object]";
	},

	serialize: function(data) {
		var keyDelimeterLeft = this.hashNotation ? "[" : ".",
		    keyDelimeterRight = this.hashNotation ? "]" : "",
		    arrayKeyDelimeterLeft = "[",
		    arrayKeyDelimeterRight = "]",
		    params = [];

		return this._serialize(data, params, "", keyDelimeterLeft, keyDelimeterRight, arrayKeyDelimeterLeft, arrayKeyDelimeterRight).join("&");
	},

	_serialize: function(data, params, keyPrefix, keyDelimeterLeft, keyDelimeterRight, arrayKeyDelimeterLeft, arrayKeyDelimeterRight) {
		var nextKeyPrefix,
		    arrayKeyRegex = /^[0-9+]$/,
		    name, value;

		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				if (this._isObject(data[key])) {
					if (keyPrefix) {
						if (arrayKeyRegex.test(key)) {
							nextKeyPrefix = keyPrefix + arrayKeyDelimeterLeft + key + arrayKeyDelimeterRight;
						}
						else {
							nextKeyPrefix = keyPrefix + keyDelimeterLeft + key + keyDelimeterRight;
						}
					}
					else {
						nextKeyPrefix = key;
					}

					this._serialize(data[key], params, nextKeyPrefix, keyDelimeterLeft, keyDelimeterRight, arrayKeyDelimeterLeft, arrayKeyDelimeterRight);
				}
				else if (this._isValid(data[key])) {
					if (keyPrefix) {
						if (arrayKeyRegex.test(key)) {
							name = keyPrefix + arrayKeyDelimeterLeft + escape(key) + arrayKeyDelimeterRight;
						}
						else {
							name = keyPrefix + keyDelimeterLeft + escape(key) + keyDelimeterRight;
						}
					}
					else {
						name = escape(key);
					}

					value = escape(data[key]);
					params.push(name + "=" + value);
				}
			}
		}

		return params;
	},

	test: function(str) {
		return this.regex.test(str);
	},

	toString: function() {
		return "[object Cerealizer.QueryString]";
	}

};

Cerealizer.registerType(Cerealizer.QueryString, [
	"queryString",
	"application/x-www-form-urlencoded",
	"multipart/form-data"
]);

Cerealizer.Xml = function Xml() {
	this.parser = this.constructor.getParser();
};

Cerealizer.Xml.getParser = function getParser() {
	if (window.DOMParser) {
		return new DOMParser();
	}
	else {
		return null;
	}
};

Cerealizer.Xml.prototype = {

	constructor: Cerealizer.Xml,

	parser: null,

	regex: /^\s*<[a-zA-Z][a-zA-Z0-9:]*.*?<\/[a-zA-Z0-9:]+[a-zA-Z]>\s*$/,

	_deserializeMSIE: function(str) {
		var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(str);

		return xmlDoc;
	},

	_deserializeStandard: function(str) {
		return this.parser.parseFromString(str, "text/xml");
	},

	_escape: function(x) {
		return String(x)
			.replace(/\&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	},

	_isObject: function(x) {
		return Object.prototype.toString.call(x) === "[object Object]";
	},

	serialize: function(data) {
		var tags = this._serialize(data, []);
		return tags.join("");
	},

	_serialize: function(data, tags) {
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				if (this._isObject(data[key])) {
					tags.push("<" + key + ">");
					this._serialize(data[key], tags);
					tags.push("</" + key + ">");
				}
				else {
					tags.push("<" + key + ">" + this._escape(data[key]) + "</" + key + ">");
				}
			}
		}

		return tags;
	},

	test: function(str) {
		return this.regex.test(str);
	},

	toString: function() {
		return "[object Cerealizer.Xml]";
	}

};

if (window.DOMParser) {
	Cerealizer.Xml.prototype.deserialize = Cerealizer.Xml.prototype._deserializeStandard;
}
else if (window.ActiveXObject) {
	Cerealizer.Xml.prototype.deserialize = Cerealizer.Xml.prototype._deserializeMSIE;
}
else {
	throw new Error("No native XML parser could be found.");
}

Cerealizer.registerType(Cerealizer.Xml, [
	"xml",
	"text/xml",
	"application/xml"
]);

function Callbacks(context, types) {
	if (context) {
		this.context = context;
		this.types = types || {};
	}
}

Callbacks.prototype = {

	context: null,

	types: null,

	destructor: function() {
		this.context = this.types = null;
	},

	add: function(name, method) {
		if (!this.types[name]) {
			this.types[name] = [];
		}

		this.types[name].push(method);

		return this;
	},

	execute: function(name) {
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

	remove: function(name, method) {
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
		addCallback: function(name, method) {
			if (!this.prototype.callbacks[name]) {
				this.prototype.callbacks[name] = [];
			}
			else if (!this.prototype.callbacks[name] instanceof Array) {
				this.prototype.callbacks[name] = [this.prototype.callbacks[name]];
			}

			this.prototype.callbacks[name].push(method);
		}
	},

	prototype: {
		callbacks: {},

		initCallbacks: function(types) {
			if (!this.hasOwnProperty("callbacks")) {
				this.callbacks = new Callbacks(this);
			}

			if (types) {
				this.callbacks.types = types;
			}
		},

		destroyCallbacks: function() {
			if (this.callbacks) {
				this.callbacks.destructor();
				this.callbacks = null;
			}
		}
	}
};

dom = window.dom || {};
dom.events = dom.events || {};

dom.events.Delegator = function() {

// Access: Public

	this.initialize = function(delegate, node, actionPrefix) {
		this.actionPrefix = null;
		this.eventTypes = [];
		this.eventTypesAdded = {};
		this.eventActionMapping = null;
		this.actionEventMapping = null;
		this.delegate = delegate || null;
		this.node = node || null;

		if (actionPrefix) {
			this.setActionPrefix(actionPrefix);
		}
	};

	this.destructor = function() {
		if (this.node) {
			this.removeEventTypes(this.eventTypes);
			this.node = null;
		}

		this.delegate = self = null;
	};

	this.init = function() {
		if (typeof this.node === "string") {
			this.node = document.getElementById(this.node);
		}

		return this;
	};

	if (!this.addEventListener) {
		this.addEventListener = function(element, eventType, callback) {
			if (element.addEventListener) {
				element.addEventListener(eventType, callback, false);
			}
			else {
				element.attachEvent("on" + eventType, callback);
			}
		};
	}

	this.addEventType = function(eventType) {
		if (this.eventTypesAdded[eventType]) {
			return;
		}

		if (eventType === "enterpress") {
			this.addEventListener(this.node, "keypress", handleEnterpressEvent);
		}
		else {
			this.addEventListener(this.node, eventType, handleEvent);
		}

		this.eventTypes.push(eventType);
		this.eventTypesAdded[eventType] = true;
	};

	this.addEventTypes = function(eventTypes) {
		var i = 0, length = eventTypes.length;

		for (i; i < length; ++i) {
			this.addEventType(eventTypes[i]);
		}
	};

	if (!this.removeEventListener) {
		this.removeEventListener = function(element, eventType, callback) {
			if (element.removeEventListener) {
				element.removeEventListener(eventType, callback, false);
			}
			else {
				element.detachEvent("on" + eventType, callback);
			}
		};
	}

	this.removeEventType = function(eventType) {
		if (this.eventTypesAdded[eventType]) {
			if (eventType === "enterpress") {
				this.removeEventListener(this.node, "keypress", handleEnterpressEvent);
			}
			else {
				this.removeEventListener(this.node, eventType, handleEvent);
			}

			this.eventTypesAdded[eventType] = false;
		}
	};

	this.removeEventTypes = function(eventTypes) {
		var i = 0, length = eventTypes.length;

		for (i; i < length; ++i) {
			this.removeEventType(eventTypes[i]);
		}
	};

	this.setActionPrefix = function(actionPrefix) {
		if (!actionPrefix.match(/\.$/)) {
			actionPrefix += ".";
		}

		this.actionPrefix = actionPrefix;
	};

	this.setEventActionMapping = function(mapping) {
		var eventType, i, length;

		if (this.eventActionMapping) {
			for (eventType in this.eventActionMapping) {
				if (this.eventActionMapping.hasOwnProperty(eventType)) {
					this.removeEventType(eventType);
				}
			}
		}

		this.actionEventMapping = {};

		for (eventType in mapping) {
			if (mapping.hasOwnProperty(eventType)) {
				this.addEventType(eventType);
				mapping[eventType] = (mapping[eventType] instanceof Array) ? mapping[eventType] : [ mapping[eventType] ];

				for (i = 0, length = mapping[eventType].length; i < length; i++) {
					this.actionEventMapping[ mapping[eventType][i] ] = eventType;
				}
			}
		}

		this.eventActionMapping = mapping;

		mapping = null;
	};

	if (!this.triggerEvent) {
		this.triggerEvent = function(type) {
			var event = getDocument().createEvent("CustomEvent");
			event.initCustomEvent(type, true, false, null);
			this.node.dispatchEvent(event);
			event = null;
		};
	}

// Access: Private

	var self = this;

	this.node = null;

	this.eventTypes = null;

	this.eventTypesAdded = null;

	this.delegate = null;

	function getActionParams(element, eventType) {
		var paramsAttr = element.getAttribute("data-actionparams-" + eventType) ||
		                 element.getAttribute("data-actionparams");

		element = null;

		return (paramsAttr) ? JSON.parse(paramsAttr) : {};
	}

	function getDocument() {
		return self.node.ownerDocument;
	}

	function getAction(rawAction) {
		return self.actionPrefix ? rawAction.replace(/.+?(\w+)$/g, "$1") : rawAction;
	}

	function getMethodFromAction(rawAction, action) {
		var method = action;

		if (self.actionPrefix) {
			method = action;

			if (self.actionPrefix + method !== rawAction) {
				method = null;
			}
			else if (!self.delegate[method] && self.delegate.handleAction) {
				method = "handleAction";
			}
		}
		else if (!self.delegate[method] && self.delegate.handleAction) {
			method = "handleAction";
		}

		return method;
	};

	function stopPropagationPatch() {
		this._stopPropagation();
		this.propagationStopped = true;
	}

	function patchEvent(event) {
		if (!event._stopPropagation) {
			event._stopPropagation = event.stopPropagation;
			event.stopPropagation = stopPropagationPatch;
			event.propagationStopped = false;
			event.stop = function() {
				this.preventDefault();
				this.stopPropagation();
			};

			if (!event.actionTarget) {
				// This event has not been delegated yet. Start the delegation at the target
				// element for the event. Note that event.target !== self.node. The
				// event.target object is the element that got clicked, for instance.
				event.actionTarget = event.target || event.srcElement;
			}
		}

		return event;
	}

	function handleEvent(event) {
		event = patchEvent(event || window.event);
		handlePatchedEvent(event, event.actionTarget);
		event = null;
	}

	function handleEnterpressEvent(event) {
		if (event.keyCode === 13) {
			handleEvent(event);
		}

		event = null;
	}

	function handlePatchedEvent(event, element) {
		// The default method to call on the delegate is "handleAction". This will only
		// get called if the delegate has defined a "handleAction" method.
		var rawAction = null, action = null, method = null, params;

		rawAction = element.getAttribute("data-action-" + event.type) || element.getAttribute("data-action");

		if (rawAction) {
			action = getAction(rawAction);

			if (self.actionEventMapping && self.actionEventMapping[ action ] !== event.type) {
				// An action-to-event mapping was found, but not for this action + event combo. Do nothing.
				// For instance, the action is "foo", and the event is "click", but eventActionMapping.foo
				// is either undefined or maps to a different event type.
				action = null;
			}
			else {
				method = getMethodFromAction(rawAction, action);
			}
		}

		if (method && self.delegate[method]) {
			// The method exists on the delegate object. Try calling it...
			try {
				params = getActionParams(element, event.type);
				self.delegate[method](event, element, params, action);
			}
			catch (error) {
				event.preventDefault();
				event.stopPropagation();
				handleActionError(event, element, params, action, method, error);
			}
		}

		if (!event.propagationStopped && element !== self.node && element.parentNode) {
			// The delegate has not explicitly stopped the event, so keep looking for more data-action
			// attributes on the next element up in the document tree.
			event.actionTarget = element.parentNode;
			handlePatchedEvent(event, event.actionTarget);
		}
		else {
			// Finished calling actions. Return event object to its normal state. Let
			// event continue bubbling up the DOM.
			event.actionTarget = null;
			event.stopPropagation = event._stopPropagation;
			event._stopPropagation = null;
			event.propagationStopped = null;
		}

		event = element = null;
	}
 
	function handleActionError(event, element, params, action, method, error) {
		// The delegate method threw an error. Try to recover gracefully...

		if (self.delegate.handleActionError) {
			// The delegate has a generic error handler, call that, passing in the error object.
			self.delegate.handleActionError(event, element, {error: error, params: params, method: method}, action);
		}
		else if (self.constructor.errorDelegate) {
			// A master error delegate was found (for instance, and application object). Call "handleActionError"
			// so this one object can try handling errors gracefully.
			self.constructor.errorDelegate.handleActionError(event, element, {error: error, params: params, method: method}, action);
		}
		else if (self.constructor.logger) {
			// A class level logger was found, so log an error level message.
			self.constructor.logger.warn("An error was thrown while executing method \"" + method + "\", action \"" + action + "\", during a \"" + event.type + "\" event on element " + self.node.nodeName + "." + self.node.className.split(/\s+/g).join(".") + "#" + self.node.id + ".");
			self.constructor.logger.error(error);
		}
		else {
			// Give up. Throw the error and let the developer fix this.
			throw error;
		}
	}

	this.constructor = dom.events.Delegator;
	this.getActionParams = getActionParams;
	this.getMethodFromAction = getMethodFromAction;
	this.handleActionError = handleActionError;
	this.handleEvent = handleEvent;
	this.handlePatchedEvent = handlePatchedEvent;
	this.initialize.apply(this, arguments);
};

dom.events.Delegator.logger = window.console || null;
dom.events.Delegator.errorDelegate = null;

function ElementStore() {
}
ElementStore.prototype = {

	_cache: null,

	config: null,

	_document: null,

	_root: null,

	constructor: ElementStore,

	init: function(root) {
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

	destructor: function() {
		if (this._cache) {
			this.clearCache();
			this._cache = null;
		}

		this.config = this._root = this._document = null;
	},

	clearCache: function() {
		var key;

		for (key in this._cache) {
			if (this._cache.hasOwnProperty(key)) {
				this._cache[key] = null;
			}
		}

		return this;
	},

	_createElement: function(tagName) {
		return this._document.createElement(tagName);
	},

	eagerLoad: function() {
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

	get: function(key) {
		return this.getElement(key) || this.getCollection(key) || null;
	},

	getCollection: function(key) {
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

	getElement: function(key) {
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

	isCollection: function(key) {
		return this.config.collections.hasOwnProperty(key);
	},

	isElement: function(key) {
		return this.config.elements.hasOwnProperty(key);
	},

	keys: function() {
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

	_mergeConfigs: function(config, overrides, safe) {
		for (key in overrides) {
			if (overrides.hasOwnProperty(key) && (config[key] === undefined || !safe)) {
				config[key] = overrides[key];
			}
		}
	},

	_parseHTML: function(html) {
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

	setConfig: function(overrides, safe) {
		this.config = this.config || { elements: {}, collections: {} };

		if (overrides.elements) {
			this._mergeConfigs(this.config.elements, overrides.elements, safe)
		}

		if (overrides.collections) {
			this._mergeConfigs(this.config.collections, overrides.collections, safe)
		}

		return this;
	},

	setRoot: function(root) {
		this.clearCache();
		this._root = root;
		this._document = this._root.nodeName === "#document" ? this._root : this._root.ownerDocument;

		return this;
	},

	toString: function() {
		return "[object ElementStore]";
	},

	_querySelector: function(selector, element) {
		return (element || this._root).querySelector(selector);
	},

	_querySelectorAll: function(selector, element) {
		return (element || this._root).querySelectorAll(selector);
	}

};

// @import Inherit.js
// @requires ElementStore

ElementStore.Utils = {
	prototype: {
		elementStore: {},

		destroyElementStore: function() {
			if (this.elementStore) {
				this.elementStore.destructor();
				this.elementStore = null;
			}
		},

		initElementStore: function(root) {
			if (!this.hasOwnProperty("elementStore")) {
				this.elementStore = new ElementStore();
			}

			this._compileElementStore();
			this._initGetters();
			this.elementStore.init(root);
		},

		_initGetters: function() {
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

		clearElementStoreCache: function() {
			this.elementStore.clearCache();
		},

		collection: function(key) {
			return this.elementStore.getCollection(key);
		},

		_compileElementStore: function() {
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

		_createCollectionGetter: function(key, propertyName) {
			var getter = function collectionGetter() {
				return this.elementStore.getCollection(key);
			};

			this.__proto__[propertyName] = getter;
		},

		_createElementGetter: function(key, propertyName) {
			var getter = function elementGetter() {
				return this.elementStore.getElement(key);
			};

			this.__proto__[propertyName] = getter;
		},

		element: function(key) {
			return this.elementStore.getElement(key);
		}
	}
};

var Events = {};

// @requires events.js

Events.Event = function Event(type, publisher, data) {
	this.type = type;
	this.publisher = publisher;
	this.data = data || {};
	this.dateStarted = (this.INCLUDE_DATE) ? new Date() : null;
	publish = data = null;
};

Events.Event.prototype = {

	INCLUDE_DATE: true,

	cancelled: false,
	data: null,
	dateStarted: null,
	publisher: null,
	type: null,

	destructor: function() {
		this.publisher = this.data = this.dateStarted = null;
	},

	cancel: function() {
		this.cancelled = true;
	}

};

// @requires events.js

Events.Dispatcher = function Dispatcher() {
	this._subscribers = {};
};

Events.Dispatcher.logger = window.console || null;

Events.Dispatcher.prototype = {

	_subscribers: null,

	constructor: Events.Dispatcher,

	destructor: function() {
		if (!this._subscribers) {
			return;
		}

		var _subscribers = this._subscribers, subscriber, eventType, i, length;

		for (eventType in _subscribers) {
			if (_subscribers.hasOwnProperty(eventType)) {
				for (i = 0, length = _subscribers[eventType].length; i < length; i++) {
					subscriber = _subscribers[eventType][i];
					subscriber.callback = subscriber.context = null;
				}

				_subscribers[eventType] = null;
			}
		}

		subscriber = _subscribers = this._subscribers = null;
	},

	_dispatchEvent: function(event, _subscribers) {
		var subscriber;

		for (var i = 0, length = _subscribers.length; i < length; i++) {
			subscriber = _subscribers[i];

			if (subscriber.type === "function") {
				subscriber.callback.call(subscriber.context, event, event.publisher, event.data);
			}
			else if (subscriber.type === "string") {
				subscriber.context[ subscriber.callback ]( event, event.publisher, event.data );
			}

			if (event.cancelled) {
				break;
			}
		}

		_subscribers = subscriber = event = null;
	},

	publish: function(eventType, publisher, data) {
		if (!this._subscribers[eventType]) {
			return true;
		}

		var event = new Events.Event(eventType, publisher, data);
		var _subscribers = this._subscribers[eventType];
		var cancelled = false;

		this._dispatchEvent(event, _subscribers);
		cancelled = event.cancelled;
		event.destructor();

		event = publisher = data = _subscribers = null;

		return !cancelled;
	},

	subscribe: function(eventType, context, callback) {
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

	unsubscribe: function(eventType, context, callback) {
		if (this._subscribers[eventType]) {
			var contextType = typeof context;
			var callbackType = typeof callback;
			var _subscribers = this._subscribers[eventType];
			var i = _subscribers.length;
			var subscriber;

			if (contextType === "function") {
				callback = context;
				context = null;
				callbackType = "function";
			}
			else if (contextType === "object" && callbackType === "undefined") {
				callbackType = "any";
			}

			while (i--) {
				subscriber = _subscribers[i];

				if (
				    (callbackType === "any" && subscriber.context === context) ||
						(subscriber.type === callbackType && subscriber.context === context && subscriber.callback === callback)
				) {
					_subscribers.splice(i, 1);
				}
			}
		}

		context = callback = _subscribers = subscriber = null;
	},

	unsubscribeAll: function(context) {
		var type, i, _subscribers;

		for (type in this._subscribers) {
			if (this._subscribers.hasOwnProperty(type)) {
				_subscribers = this._subscribers[type];
				i = _subscribers.length;

				while (i--) {
					if (_subscribers[i].context === context) {
						_subscribers.splice(i, 1);
					}
				}
			}
		}

		context = _subscribers = null;
	}
};

// @requires events.js
// @requires events/dispatcher.js
// @requires events/event.js

Events.ApplicationEvents = {

	eventDispatcher: null,

	self: {

		getEventDispatcher: function() {
			if (!Events.ApplicationEvents.eventDispatcher) {
				Events.ApplicationEvents.eventDispatcher = new Events.Dispatcher();
			}

			return Events.ApplicationEvents.eventDispatcher;
		},

		checkEventDispatcher: function() {
			if (!this.getEventDispatcher()) {
				throw new Error("No application event dispatcher was found. Please set Events.ApplicationEvents.eventDispatcher.");
			}

			return true;
		},

		publish: function(eventName, publisher, data) {
			this.checkEventDispatcher();
			return this.getEventDispatcher().publish(eventName, publisher, data);
		},

		subscribe: function(eventName, context, callback) {
			this.checkEventDispatcher();
			this.getEventDispatcher().subscribe(eventName, context, callback);
		},

		unsubscribe: function(eventName, context, callback) {
			this.checkEventDispatcher();
			this.getEventDispatcher().unsubscribe(eventName, context, callback);
		}

	},

	prototype: {

		eventDispatcher: null,

		_initApplicationEvents: function() {
			if (!this.hasOwnProperty("eventDispatcher")) {
				this.eventDispatcher = this.constructor.getEventDispatcher();
			}
		},

		_destroyApplicationEvents: function() {
			if (this.eventDispatcher) {
				this.eventDispatcher.unsubscribe(this);
			}
		},

		publish: function(eventName, data) {
			return this.eventDispatcher.publish(eventName, this, data);
		},

		subscribe: function(eventName, context, callback) {
			this.eventDispatcher.subscribe(eventName, context, callback);

			return this;
		},

		unsubscribe: function(eventName, context, callback) {
			this.eventDispatcher.unsubscribe(eventName, context, callback);

			return this;
		}

	}

};

// @requires events.js
// @requires events/dispatcher.js
// @requires events/event.js
// @requires events/application_events.js

Events.Notifications = {

	includes: Events.ApplicationEvents,

	guid: 0,

	self: {

		addNotifications: function(newNotifications) {
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

		_initNotifications: function() {
			if (!this.__proto__.hasOwnProperty("_compiledNotifications")) {
				this._compileNotifications();
			}

			this._initApplicationEvents();

			this._notificationId = Events.Notifications.guid++;

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

		_compileNotifications: function() {
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

		_destroyNotifications: function() {
			if (this._notificationDispatcher) {
				this._notificationDispatcher.destructor();
				this._notificationDispatcher = null;
			}
		},

		_setUpNotifications: function() {
			// Child classes may override this to do something special with adding notifications.
		},

		notify: function(message, data) {
			var success = this.publish(this._notificationIdPrefix + "." + this._notificationId + "." + message, data);
			data = null;
			return success;
		},

		listen: function(message, context, notification) {
			this.subscribe(this._notificationIdPrefix + "." + this._notificationId + "." + message, context, notification);
			context = notification = null;

			return this;
		},

		ignore: function(message, context, notification) {
			this.unsubscribe(this._notificationIdPrefix + "." + this._notificationId + "." + message, context, notification);
			context = notification = null;

			return this;
		}

	}

};

/**
 * class Hash < Object
 *
 * This class represents a managed key-value pair store.
 **/
function Hash(data) {
	if (data) {
		this.merge(data);
	}
}
Hash.prototype = {

	constructor: Hash,

	destructor: function() {
		for (var key in this) {
			if (this.exists(key)) {
				this[key] = null;
			}
		}
	},

	empty: function() {
		var keys = this.keys(), i = 0, length = keys.length, key;

		for (i; i < length; i++) {
			key = keys[i];
			this[key] = null;
			delete this[key];
		}

		return this;
	},

	exists: function(key) {
		return (!this.isReserved(key) && this.hasOwnProperty(key)) ? true : false;
	},

	filter: function(callback, context) {
		context = context || this;
		var filteredHash = new Hash();

		for (var key in this) {
			if (this.exists(key) && callback.call(context, key, this[key])) {
				filteredHash.set(key, this[key]);
			}
		}

		return filteredHash;
	},

	forEach: function(callback, context) {
		context = context || this;

		for (var key in this) {
			if (this.exists(key)) {
				if (callback.call(context, key, this[key]) === false) {
					break;
				}
			}
		}

		callback = context = null;

		return this;
	},

	get: function(key) {
		if (this.isReserved(key)) {
			throw new Error("Cannot get reserved property: " + key);
		}
		else {
			return this.hasOwnProperty(key) ? this[key] : null;
		}
	},

	isEmpty: function() {
		return this.size() === 0;
	},

	isReserved: function(key) {
		return this.constructor.prototype.hasOwnProperty(key);
	},

	keys: function() {
		var keys = [];

		for (var key in this) {
			if (this.exists(key)) {
				keys.push(key);
			}
		}

		return keys;
	},

	merge: function(overrides, safe) {
		if (!overrides) {
			throw new Error("Missing required argument: overrides");
		}

		var key, newValue, oldValue, i, length;

		for (key in overrides) {
			if (overrides.hasOwnProperty(key)) {
				oldValue = this[key];
				newValue = overrides[key];

				if (!newValue) {
					if (!this.exists(key) || !safe) {
						this.set(key, newValue);
					}
				}
				else if (newValue.constructor === Array && oldValue && oldValue.constructor === Array && !this.isReserved(key)) {
					for (i = 0, length = newValue.length; i < length; i++) {
						oldValue.push(newValue[i]);
					}
				}
				else if (oldValue && oldValue.constructor === Hash && !this.isReserved(key)) {
					oldValue.merge(newValue);
				}
				else if (!this.exists(key) || !safe) {
					this.set(key, overrides[key]);
				}
			}
		}

		return this;
	},

	safeMerge: function(overrides) {
		this.merge(overrides, true);
	},

	set: function(key, value) {
		if (this.isReserved(key)) {
			throw new Error("Cannot set reserved property: " + key);
		}

		this[key] = value;

		return this;
	},

	size: function() {
		return this.keys().length;
	},

	toString: function() {
		return "[object Hash]";
	}

};

(function(g) {

	/**
	 * class Hypodermic < Object
	 *
	 * This class provides basic dependency injection for JavaScript and is a
	 * light weight object factory as well.
	 *
	 * new Hypodermic([configs])
	 * - configs (Object): Optional configs for this object factory.
	 **/
	function Hypodermic(configs) {
		configs = configs || {};

		configs[this.constructor.me] = {
			className: this.constructor.className,
			singleton: true
		};

		this._configs = configs;
		this._singletons = {};
		this._singletons[this.constructor.me] = this;
		configs = null;
	}

	/**
	 * Hypodermic.me -> String
	 *
	 * The name of the singleton config Id so objects can be injected with a
	 * reference to this object factory.
	 **/
	Hypodermic.me = "objectFactory";

	/**
	 * Hypodermic.className -> String
	 *
	 * The name of this class.
	 **/
	Hypodermic.className = "Hypodermic";

	Hypodermic.prototype = {

		/**
		 * Hypodermic#_configs -> Object
		 *
		 * The configs defining the objects this factory can generate, and their
		 * dependencies.
		 **/
		_configs: null,

		/**
		 * Hypodermic#_singletons -> Object
		 *
		 * References to objects that are singletons in this object factory.
		 **/
		_singletons: null,

		/**
		 * Hypodermic#destructor()
		 *
		 * Ready this object factory for garbage collection.
		 **/
		destructor: function() {
			this._destroySingletons();
			this.configs = this.classReferenceCache = null;
		},

		_destroySingletons: function() {
			for (var id in this.singletons) {
				if (!this.singletons.hasOwnProperty(id)) { continue; }
				this.singletons[ id ] = null;
			}

			this.singletons = null;
		},

		_capitalize: function(str) {
			return str.charAt(0).toUpperCase() + str.substring(1, str.length);
		},

		_createInstanceFromConfig: function(config) {
			if (!config.className) {
				throw new Error("Missing required className for instance configuration");
			}

			var instance = null;
			var Klass = this._getClassReference(config.className);
			var ProxyClass = null;
			var constructorArgs = null;
			var parentConf = null;

			if (!Klass) {
				throw new Error("Failed to create instance. Class \"" + config.className + "\" was not found");
			}

			if (Object.prototype.toString.call(Klass) === "[object Function]") {
				// instance is to be created from constructor function

				if (config.constructorArgs) {
					ProxyClass = function() {};
					ProxyClass.prototype = Klass.prototype;

					instance = new ProxyClass();
					constructorArgs = this._getConstructorArgs(config.constructorArgs);
					Klass.apply(instance, constructorArgs);
				}
				else {
					instance = new Klass();
				}
			}
			else {
				// instance is already an object
				instance = Klass;
			}

			// inject properties from parent configs
			if (config.parent) {
				parentConf = this._configs[config.parent];

				while (parentConf) {
					if (parentConf.properties) {
						this._injectDependencies(instance, parentConf.properties);
					}

					parentConf = this._configs[parentConf.parent] || null;
				}
			}

			// inject properties for this instance as overrides
			if (config.properties) {
				this._injectDependencies(instance, config.properties);
			}

			ProxyClass = null;
			Klass = null;
			config = null;
			parentConf = null;

			return instance;
		},

		_getClassReference: function(className) {
			var Klass = _classCache[className] || null;

			if (!Klass && /^[a-zA-Z][\w.$]+$/.test(className)) {
				try {
					Klass = eval(className);
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

		_getConstructorArgs: function(constructorArgsConfig) {
			var constructorArgs = [];

			for (var i = 0, length = constructorArgsConfig.length; i < length; i++) {
				constructorArgs.push(this._getDependencyValue(constructorArgsConfig[i]));
			}

			return constructorArgs;
		},

		_getDependencyValue: function(propertyConfig) {
			var value = null;

			if (propertyConfig.id) {
				value = this.getInstance(propertyConfig.id);
			}
			else if ( typeof propertyConfig.value !== "undefined" ) {
				value = propertyConfig.value;
			}
			else {
				throw new Error("Cannot extract dependency value. Property config missing one of \"id\" or \"value\"");
			}

			propertyConfig = null;

			return value;
		},

		/**
		 * Hypodermic#getInstance(id) -> Object | null
		 * - id (String): The Id of the config to use to generate this new object
		 *
		 * Get an instance of an object from this object factory. If the id is not
		 * found, then null is returned;
		 **/
		getInstance: function(id) {
			var config = this._configs[id];
			var instance = null;

			if (!config) {
				instance = null;
			}
			else if (config.singleton) {
				instance = this._getSingletonInstance(id, config);
			}
			else if (!config.abstract) {
				instance = this._createInstanceFromConfig(config);
			}
			else {
				throw new Error("Cannot instantiate an object from abstract config \"" + id + "\"");
			}

			return instance;
		},

		_getSingletonInstance: function(id, config) {
			var instance = null;

			if (this._singletons[id]) {
				instance = this._singletons[id];
			}
			else {
				instance = this._createInstanceFromConfig(config);
				this._singletons[id] = instance;
			}

			return instance;
		},

		_injectDependencies: function(instance, properties) {
			var setterName = "";
			var adderName = "";
			var name = "";
			var value = null;

			for (name in properties) {
				if (!properties.hasOwnProperty(name)) { continue; }

				value = this._getDependencyValue(properties[name]);
				setterName = "set" + this._capitalize(name);
				adderName = "add" + this._capitalize(name);

				if (this._isFunction(instance[setterName])) {
					// inject foo property via setFoo()
					instance[setterName](value);
				}
				else if (this._isFunction(instance[adderName])) {
					// inject foo property via addFoo()
					instance[adderName](value);
				}
				else {
					// inject foo via property name
					instance[name] = value;
				}
			}

			properties = instance = value = null;
		},

		_isArray: function(x) {
			return (x instanceof Array) ? true : false;
		},

		_isFunction: function(x) {
			return (Object.prototype.toString.call(x) === "[object Function]") ? true : false;
		},

		_isObject: function(x) {
			return (x instanceof Object) ? true : false;
		},

		/**
		 * Hypodermic#setConfigs(configs)
		 * - configs (Object): New object configs to add
		 *
		 * Add object configs to this factory.
		 **/
		setConfigs: function(configs) {
			for (var id in configs) {
				if (!configs.hasOwnProperty(id)) { continue; }

				this._configs[id] = configs[id];
			}

			configs = null;
		}

	};

	Hypodermic.prototype.constructor = Hypodermic;

	Hypodermic.precacheClasses = function(classNames) {
		for (var name in classNames) {
			if (classNames.hasOwnProperty(name) && !_classCache.hasOwnProperty(name)) {
				_classCache[name] = classNames[name];
			}
		}
	};

	// Seed the class cache with some defaults
	var _classCache = {
		Array: g.Array,
		Boolean: g.Boolean,
		Date: g.Date,
		Error: g.Error,
		Function: g.Function,
		Hypodermic: Hypodermic,
		Number: g.Number,
		Object: g.Object,
		RegExp: g.RegExp,
		String: g.String
	};

	(function() {
		var conditionalClasses = ["XMLHttpRequest", "FileReader", "DOMParser", "DocumentFragment"], x;

		for (var i = 0, length = conditionalClasses.length; i < length; i++) {
			x = conditionalClasses[i];

			if (g[x] !== undefined) {
				_classCache[x] = g[x];
			}
		}
	})();

	// make this global
	g.Hypodermic = Hypodermic;

})(typeof global != "undefined" ? global : window);

function Reaper() {
}

Reaper.prototype = {

	allowNulls: false,

	flat: true,

	nestedKeysRegex: /[.\[\]]+/g,

	constructor: Reaper,

	_extractFieldValues: function(fields, data) {
		var value, name, i = 0, length = fields.length;

		for (i; i < length; i++) {
			value = this._extractValue(fields[i]);
			name = fields[i].name;
			this._setValue(data, name, value);
		}
	},

	_extractValue: function(field) {
		var nodeName = field.nodeName.toLowerCase(),
		    value = null, i, length;

		if (!field.disabled) {
			if (nodeName === "input") {
				if (field.type === "checkbox" || field.type === "radio") {
					if (field.checked) {
						value = field.value;
					}
				}
				else {
					value = field.value;
				}
			}
			else if (nodeName === "select") {
				if (field.multiple) {
					value = [];

					for (i = 0, length = field.options.length; i < length; ++i) {
						if (!field.options[i].disabled && field.options[i].selected && field.options[i].value) {
							value.push(field.options[i].value);
						}
					}
				}
				else {
					value = field.value;
				}
			}
			else {
				value = field.value;
			}
		}

		field = null;

		return (value === "") ? null : value;
	},

	getData: function(element, data) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}

		data = data || {};

		var inputs = element.getElementsByTagName("input"),
		    selects = element.getElementsByTagName("select"),
		    textareas = element.getElementsByTagName("textarea");

		this._extractFieldValues(inputs, data);
		this._extractFieldValues(selects, data);
		this._extractFieldValues(textareas, data);

		element = inputs = selects = textareas = null;

		return data;
	},

	_setNestedValue: function(data, keys, value) {
		var currData = data,
		    key, i = 0,
		    length = keys.length - 1,
		    lastKey = keys[ length ];

		// Find the object we want to set the value on
		for (i; i < length; i++) {
			key = keys[i];

			if (!currData.hasOwnProperty(key)) {
				currData[key] = {};
			}

			currData = currData[key];
		}

		currData[lastKey] = value;

		currData = keys = null;
	},

	_setValue: function(data, name, value) {
		if (this.flat) {
			if (value !== null || this.allowNulls) {
				data[name] = value;
			}
		}
		else if (value !== null || this.allowNulls) {
			var keys = name
				.replace(/\]$/, "")
				.split(this.nestedKeysRegex);

			this._setNestedValue(data, keys, value);
		}
	}

};

// @import Injerit.js
// @import ElementStore
// @import ElementStore.Utils
// @import callbacks
// @import hash
// @import dom_event_delegator
// @import events

(function(g) {

var _guid = 0;

var Module = Object.extend({

	includes: [
		Callbacks.Utils,
		Events.Notifications,
		ElementStore.Utils
	],

	self: {
		manager: null,

		getManager: function getManager() {
			return Module.manager;
		},

		unregister: function unregister(module) {
			if (Module.manager) {
				Module.manager.unregisterModule(module);
			}
		}
	},

	prototype: {

		actions: {
			click: [
				"cancel"
			]
		},

		callbacks: {
			afterReady: [
				"_loaded"
			]
		},

		delegator: null,

		document: null,

		element: null,

		elementStore: {},

		guid: null,

		options: {
			actionPrefix: null,
			defaultModule: false,
		},

		window: null,

		initialize: function initialize() {
			this.guid = _guid++;
		},

		init: function init(elementOrId, options) {
			this.element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;

			if (!this.element) {
				throw new Error("Could not find element: " + elementOrId);
			}

			this.document = this.element.ownerDocument;
			this.window = this.document.defaultView || this.document.parentWindow;

			if (!this.hasOwnProperty("options")) {
				this.options = new Hash();
			}

			this._initOptions(this.options);

			if (options) {
				this.options.merge(options);
			}

			if (!this.delegator) {
				this.delegator = new dom.events.Delegator();
			}

			this.delegator.delegate = this;
			this.delegator.node = this.element;

			if (this.options.actionPrefix) {
				this.delegator.setActionPrefix(this.options.actionPrefix);
			}

			this.delegator.init();

			this._initActions();
			this._initCallbacks();
			this._initNotifications();
			this.initElementStore(this.element);
			this.callbacks.execute("beforeReady");
			this._ready();
			this.callbacks.execute("afterReady");

			if (this.options.defaultModule) {
				this.constructor.getManager().setDefaultModule(this);
			}

			return this;
		},

		destructor: function destructor(keepElement) {
			this.callbacks.execute("beforeDestroy");

			this.constructor.unregister(this);
			this.destroyElementStore();
			this.destroyCallbacks();

			if (this.delegator) {
				this.delegator.destructor();
			}

			if (!keepElement && this.element) {
				this.element.parentNode.removeChild(this.element);
			}

			if (this.options) {
				this.options.destructor();
			}

			this.actions = this.element = this.delegator = this.options = this.document = this.window = null;
		},

		cancel: function cancel(event, element, params) {
			event.stop();
			this.destructor();
			event = element = params = null;
		},

		focus: function focus(anything) {
			var els = this.element.getElementsByTagName("*");
			var i = 0, length = els.length, el;

			if (anything) {
				for (i; i < length; i++) {
					el = els[i];

					if (el.tagName === "A" || el.tagName === "BUTTON" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "hidden")) {
						if (el.focus) {
							el.focus();
						}

						if (el.select) {
							el.select();
						}

						break;
					}
				}
			}
			else {
				for (i; i < length; i++) {
					el = els[i];

					if (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "hidden")) {
						if (el.focus) {
							el.focus();
						}

						if (el.select) {
							el.select();
						}

						break;
					}
				}
			}
		},

		_ready: function _ready() {

		},

		_initActions: function _initActions() {
			// TODO: Actions appear to be merging incorrectly here and making delegator double up on events
			var actions = new Hash(), proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("actions")) {
					actions.safeMerge(proto.actions);
				}

				proto = proto.__proto__;
			}

			this.delegator.setEventActionMapping(actions);
		},

		_initCallbacks: function _initCallbacks() {
			var types = new Hash(), proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("callbacks")) {
					types.safeMerge(proto.callbacks);
				}

				proto = proto.__proto__;
			}

			this.initCallbacks(types);
		},

		_initOptions: function _initOptions() {
			var proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("options")) {
					this.options.safeMerge(proto.options);
				}

				proto = proto.__proto__;
			}
		},

		_loading: function _loading(element) {
			element = element || this.element;
			element.className += " loading";
			element = null;
		},

		_loaded: function _loaded(element) {
			element = element || this.element;
			element.className = element.className.replace(/(^|\s+)(loading)(\s+|$)/, "$1$3").replace(/[\s]{2,}/g, " ");
			element = null;
		},

		setOptions: function setOptions(overrides) {
			if (!this.hasOwnProperty("options")) {
				this.options = new Hash(overrides);
			}
			else {
				this.options.merge(overrides);
			}
		}

	}

});

// Make globally available
g.Module = Module;

})(window);
Module.FormModule = Module.extend({

	prototype: {

		actions: {
			enterpress: [
				"submit"
			],
			submit: [
				"submit"
			]
		},

		callbacks: {
			beforeReady: [
				"initExtractor",
				"initSerializerFactory"
			]
		},

		extractor: null,

		options: {
			"extractor.allowNulls": false,
			"extractor.flat": false
		},

		serializerFactory: null,

		initExtractor: function initExtractor() {
			this.extractor = this.extractor || new Reaper();
			this.extractor.allowNulls = this.options["extractor.allowNulls"];
			this.extractor.flat = this.options["extractor.flat"];
		},

		initSerializerFactory: function initSerializerFactory() {
			this.serializerFactory = this.serializerFactory || Cerealizer;
		},

		_afterSubmit: function _afterSubmit(xhr) {
			xhr = null;
		},

		_beforeSubmit: function _beforeSubmit(data, event, element, params) {
			data = event = element = params = null;
			return true;
		},

		_getData: function _getData() {
			return this.extractor.getData(this.element);
		},

		_getTransport: function _getTransport() {
			return new XMLHttpRequest();
		},

		_sendRequest: function _sendRequest(data) {
			var xhr = this._getTransport(),
			    form = this.element.getElementsByTagName("form")[0] || this.element,
			    method      = (form.getAttribute("method") || form.getAttribute("data-form-method") || "POST").toUpperCase(),
			    url         = form.getAttribute("action")  || form.getAttribute("data-form-action"),
			    contentType = form.getAttribute("enctype") || form.getAttribute("data-form-enctype") || "queryString",
			    module = this,
			    serializer = this.serializerFactory.getInstance(contentType),
			    params = serializer.serialize(data);

			if (!url) {
				throw new Error("Missing required attribute: action or data-form-action");
			}

			var onreadystatechange = function() {
				if (this.readyState !== 4) {
					return;
				}

				if (this.status < 300 || this.status > 399) {
					module.element.innerHTML = this.responseText;
					complete();
				}
			};

			var complete = function() {
				module._loaded();
				module._afterSubmit(xhr);
				module = data = event = element = params = xhr = xhr.onreadystatechange = form = null;
			};

			if (method === "GET") {
				url += /\?/.test(url) ? params : "?" + params;
				params = null;
			}

			xhr.open(method, url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			if (contentType) {
				xhr.setRequestHeader("Content-Type", contentType);
			}

			this._loading();
			xhr.onreadystatechange = onreadystatechange;
			xhr.send(params);
		},

		submit: function submit(event, element, params) {
			event.stop();

			var data = this._getData();

			if (this._beforeSubmit(data, event, element, params)) {
				this._sendRequest(data);
			}
		}

	}

});

Module = window.Module || {};

Module.Factory = function Factory() {};

Module.Factory.prototype = {

	objectFactory: null,

	constructor: Module.Factory,

	destructor: function destructor() {
		this.objectFactory = null;
	},

	createInstance: function createInstance(element, type, options) {
		var module = this.getInstance(type);

		module.init(element, options);

		return module;
	},

	getInstance: function getInstance(type) {
		var instance = null, Klass = null;

		if (this.objectFactory) {
			instance = this.objectFactory.getInstance(type);

			if (!instance) {
				throw new Error("The object factory failed to get a new instance for type: " + type);
			}
		}
		else if (/^[a-zA-Z][a-zA-Z0-9.]+[a-zA-Z0-9]$/.test(type)) {
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

		return instance;
	}

};

// @requires module/factory.js

window.Module = window.Module || {};

Module.Manager = function Manager() {};

Module.Manager.prototype = {

	baseClassName: "module",

	defaultModule: null,

	defaultModuleFocused: false,

	factory: null,

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

		if (this.factory) {
			if (cascadeDestroy) {
				this.factory.destructor();
			}

			this.factory = null;
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
		this.factory = (this.hasOwnProperty("factory")) ? this.factory : new Module.Factory();
		this.registry = (this.hasOwnProperty("registry")) ? this.registry : {};
		this.groups = (this.hasOwnProperty("groups")) ? this.groups : {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function eagerLoadModules(element) {
		var els = element.getElementsByTagName("*"), i = 0, length = els.length, el;

		for (i; i < length; i++) {
			el = els[i];

			if (el.getAttribute("data-modules") && !el.getAttribute("data-module-lazyload")) {
				this.createModules(el);
			}
		}

		els = null;

		return this;
	},

	createModule: function createModule(element, type, options, register) {
		var className = element.className + " module " + type.charAt(0).toLowerCase() + type.slice(1, type.length).replace(/([.A-Z]+)/g, function(match, $1) {
			return "-" + $1.replace(/\./g, "").toLowerCase();
		});

		element.className = className.replace(/^\s+|\s+$/g, "");

		var module = this.factory.getInstance(type);

		module.setOptions(options);

		if (register) {
			this.registerModule(type, module);
		}

		element = options = null;

		return module;
	},

	createModules: function createModules(element) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}

		var metaData = this.getModuleMetaData(element);

		if (metaData.types.length === 1) {
			module = this.createModule(element, metaData.types[0], metaData.options, true);
			module.init(element, metaData.options);
		}
		else {
			for (i = 0, length = metaData.types.length; i < length; i++) {
				type = metaData.types[i];
				opts = metaData.options[type] || {};
				module = this.createModule(element, type, opts, true);
				module.init(element, opts);
			}
		}

		this.markModulesCreated(element, metaData);

		metaData = element = module = opts = options = null;
	},

	focusDefaultModule: function focusDefaultModule(anything) {
		if (this.defaultModule && !this.defaultModuleFocused) {
			this.defaultModuleFocused = true;
			this.defaultModule.focus(anything);
		}
	},

	getModuleMetaData: function getModuleMetaData(element) {
		var length;
		var types = element.getAttribute("data-modules");
		var options = element.getAttribute("data-module-options");
		var metaData = {
			element: element,
			types: null,
			options: null
		};

		if (!types) {
			throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
		}

		types = types.replace(/^\s+|\s+$/g, "").split(/\s+/g);
		length = types.length;
		options = (options) ? JSON.parse(options) : {};

		metaData.types = types;
		metaData.options = options;

		element = null;

		return metaData;
	},

	initModuleInContainer: function initModuleInContainer(element, container, config, template, type, module) {
		var createdAt = new Date();
		var renderData = new Hash({
			guid: module.guid,
			createdAt: createdAt,
			timestamp: createdAt.getTime()
		});

		if (config.renderData) {
			renderData.merge(config.renderData);
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

		module.init(element);
		this.registerModule(type, module);
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

		module = null;
	},

	unregisterModule: function unregisterModule(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return;
		}

		var guid = module.guid;
		var type = this.registry[guid].type;
		var group = this.groups[type];

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					break;
				}
			}
		}

		module = group = null;
	},

	setDefaultModule: function setDefaultModule(module) {
		if (!this.defaultModule) {
			this.defaultModule = module;
		}

		module = null;
	}

};

// @import Hash
// @requires module/manager.js

Module.Manager.LazyLoader = {

	prototype: {

		lazyLoadModules: function lazyLoadModules(element, overrides) {

			var _options = new Hash({
				scrollElement: null,
				scrollStopDelay: 400,
				scrollTimeout: 250
			});

			var _manager = this;
			var _scrollTimer = null;
			var _scrollElement = _options.scrollElement || null;
			var _element = element;
			var _document = _element.ownerDocument;
			var _scrollLeft = 0;
			var _scrollTop = 0;

			function init() {
				if (_manager.stopLazyLoadingModules) {
					_manager.stopLazyLoadingModules();
				}

				if (overrides) {
					_options.merge(overrides);
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
			}

			function destructor() {
				if (_element) {
					removeEvents();
					_element = _document = _scrollElement = null;
				}

				if (_scrollTimer) {
					clearTimeout(_scrollTimer);
					_scrollTimer = null;
				}

				if (_options) {
					_options.destructor();
					_options = null;
				}

				_manager.stopLazyLoadingModules = _manager = null;

				return this;
			}

			function addEvent(element, name, listener) {
				if (element.addEventListener) {
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
			}

			function initModulesInsideViewport() {
				var elements = _element.getElementsByTagName("*"), i, element;
				var viewport = Viewport.create(getScrollElement());

				for (i = 0; i < elements.length; i++) {
					element = elements[i];

					if (element.getAttribute("data-module-lazyload") && viewport.isVisible(element)) {
						lazyLoadModules(element, "scrollto");
					}
				}
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

			function lazyLoadModules(element, value) {
				var attr = element.getAttribute("data-module-lazyload");

				if (attr === "any" || new RegExp(value).test(attr)) {
					element.removeAttribute("data-module-lazyload");
					_manager.createModules(element);
					element.setAttribute("data-module-lazyloaded", attr);
				}

				element = null;
			}

			function removeEvent(element, name, listener) {
				if (element.removeEventListener) {
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
			}

			// internal class for viewport logic
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

			// start lazy loading modules
			init();

			// expose public method to clean up this function closure
			this.stopLazyLoadingModules = destructor;

			return this;
		}

	}

};

Module.Manager.include(Module.Manager.LazyLoader);

Module.Manager.SubModuleProperties = {

	included: function included(Klass) {
		if (Klass.addCallback) {
			Klass.addCallback("beforeReady", "initSubModules");
		}
	},

	prototype: {

		initSubModules: function initSubModules() {
			if (this.options.subModulesDisabled) {
				return;
			}

			this.elementStore.setConfig({
				collections: {
					subModules: { selector: "[data-module-property]", nocache: true }
				}
			});

			var elements = this.elementStore.getCollection("subModules"),
			    i = 0, length = elements.length, name;

			for (i; i < length; i++) {
				name = elements[i].getAttribute("data-module-property");
				this._createSubModuleProperty(name, elements[i]);
			}
		},

		_createSubModuleProperty: function _createSubModuleProperty(name, element) {
			if (!name) {
				throw new Error("Missing required argument: name");
			}
			else if (!element) {
				throw new Error("Missing required argument: element");
			}

			var manager = this.constructor.getManager();
			var metaData = manager.getModuleMetaData(element);
			var module, proto = this.constructor.prototype;

			if (metaData.types.length > 1) {
				throw new Error("Sub module elements cannot have more than one type specified in data-module");
			}

			module = manager.createModule(element, metaData.types[0], metaData.options);
			module.init(element);

			if (proto[name] === null) {
				if (this.hasOwnProperty(name)) {
					throw new Error("Error creating sub module. Property " + name + " already exists.");
				}

				this[name] = module;
			}
			else if (proto[name] instanceof Array) {
				if (!this.hasOwnProperty(name)) {
					this[name] = [];
				}

				this[name].push(module);
			}
			else {
				throw new Error("Cannot create module property " + name + ". Property is neither null nor an Array in the class Prototype.");
			}

			manager.markModulesCreated(element, metaData);

			manager = module = metaData = proto = element = null;
		}

	}

};

Module.include(Module.Manager.SubModuleProperties);

var Foundry = {
	version: "0.0.4"
};

/*
Lifecycle:

	1) Executed by outside code
		new Application() -> (Acquire dependencies via dependency injection)

	2) Executed by outside code
		configure()

	3) Executed by outside code
		init() -> (execute "beforeReady" callback) -> _ready() -> (publish "application.ready") -> (execute "afterReady" callback)

Example:

	1)
		a) Using dependency injection:
			var app = objectFactory.getInstance("application");
		b) No dependency injection:
			var app = new Application();
			app.moduleManager = new Module.Manager();
			app.config = new Hash();
			app.eventDispatcher = ...
			...

	2) app.configure(function(config) {
	       config.foo = "bar";
	   });

	3) window.onload = function() {
	       app.init(document);
	   };
*/
Foundry.Application = Module.extend({
	prototype: {

		actions: {
			click: [
				"createModule",
				"publishEvent"
			]
		},

		config: null,

		logger: window.console || null,

		moduleManager: null,

		objectFactory: null,

		options: {
			actionPrefix: "app",
			subModulesDisabled: true,
			focusAnythingInDefaultModule: true
		},

		destructor: function destructor() {
			if (this.moduleManager) {
				this.moduleManager.destructor(true);
				this.moduleManager = null;
			}

			if (this.objectFactory) {
				this.objectFactory.destructor();
				this.objectFactory = null;
			}

			if (this.config.handleApplicationErrors) {
				this.window.onerror = null;
			}

			this.logger = this.config = null;

			Module.prototype.destructor.call(this, true);
		},

		_ready: function _ready() {
			Module.prototype._ready.call(this);

			if (this.delegator.constructor.errorDelegate === null && this.config.handleActionErrors) {
				this.delegator.constructor.errorDelegate = this;
			}

			if (this.config.handleApplicationErrors) {
				this.window.onerror = this.handleError.bind(this);
			}

			try {
				this.moduleManager.init();

				if (this.config.eagerLoadModules) {
					this.moduleManager.eagerLoadModules(this.element);
				}

				if (this.config.lazyLoadModules) {
					this.moduleManager.lazyLoadModules(this.element);
				}

				this.subscribe("application.createModule", this, "handleCreateModule");

				this.moduleManager.focusDefaultModule(this.options.focusAnythingInDefaultModule);

				// Tell the world: "I'm Here!"
				this.publish("application.ready");
			}
			catch (error) {
				if (!this.handleError(error)) {
					throw error;
				}
			}
		},

		configure: function configure(callback, context) {
			callback.call(context || this, this.config, this);

			return this;
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
		createModule: function createModule(event, element, params) {
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
		_createModuleFromConfig: function _createModuleFromConfig(config) {
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
			var template = this.elementStore.querySelector(selector);
			var element = this.document.createElement(config.element.tag);

			if (!template) {
				throw new Error("Failed to find new module template using selector: " + selector);
			}

			if (config.container.selector) {
				container = this.elementStore.querySelector(config.container.selector);
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

			event = element = config = container = rootElement = null;

			return module;
		},

		_getErrorObject: function _getErrorObject(errorMessage) {
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

		handleActionError: function handleActionError(event, element, params) {
			if (this.logger) {
				this.logger.debug({
					event: event,
					element: element,
					params: params
				});

				this.logger.error(params.error);
			}
			else {
				throw params.error;
			}
		},

		handleCreateModule: function handleCreateModule(event) {
			this._createModuleFromConfig(event.data);

			return false;
		},

		handleError: function handleError(errorMessage) {
			var error = typeof errorMessage === "string" ? this._getErrorObject(errorMessage) : errorMessage;

			this._handleError(error);
		},

		_handleError: function _handleError(error) {
			if (this.logger) {
				this.logger.error(error);

				return true;
			}

			return false;
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
		publishEvent: function publishEvent(event, element, params) {
			if (!params.event) {
				throw new Error("Missing required argument params.event");
			}

			event.stop();
			this.constructor.publish(params.event, element, params.data || {});
		}
	}
});
