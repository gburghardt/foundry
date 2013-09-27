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
			element.addEventListener(eventType, callback, false);
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
			element.removeEventListener(eventType, callback, false);
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
				event.actionTarget = event.target;
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
