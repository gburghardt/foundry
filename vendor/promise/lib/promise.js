function Promise(promiser, context) {
	this._promiser = promiser || null;
	this._afterCallbacks = {};
	this._beforeCallbacks = {};
	this._context = context || null;
	this._callbacks = {};
	this._pendingCallbacks = {};
};

Promise.prototype = {

	_afterCallbacks: null,

	_beforeCallbacks: null,

	_callbacks: null,

	_context: null,

	_pendingCallbacks: null,

	_promiser: null,

	destructor: function() {
		var key;

		if (this._callbacks) {
			for (key in this._callbacks) {
				if (!this._callbacks.hasOwnProperty(key)) {continue;}
				this._callbacks[key] = null;
			}

			this._callbacks = null;
		}

		if (this._pendingCallbacks) {
			for (key in this._pendingCallbacks) {
				if (!this._pendingCallbacks.hasOwnProperty(key)) {continue;}
				this._pendingCallbacks[key] = null;
			}

			this._pendingCallbacks = null;
		}

		this._context = this._promiser = null;
	},

	_after: function(name, func) {
		this._afterCallbacks[name] = this._afterCallbacks[name] || [];
		this._afterCallbacks[name].push(func);
	},

	_before: function(name, func) {
		this._beforeCallbacks[name] = this._beforeCallbacks[name] || [];
		this._beforeCallbacks[name].push(func);
	},

	callbackDefined: function(name) {
		return (this.__proto__[name] && this.__proto__[name].name === "__PromiseCallback") ? true : false;
	},

	_createCallback: function(name) {
		if (this.__proto__[name]) {
			throw new Error("Failed to create callback " + name + ". A method by that name has already been defined.");
		}
		else {
			this.__proto__[name] = function __PromiseCallback(func) {
				if (this._pendingCallbacks[name]) {
					this._invokeCallback(name);
				}
				else {
					this._callbacks[name] = func;
				}
			};
		}
	},

	_createCallbacks: function() {
		var callbackNames = (arguments[0] instanceof Array) ? arguments[0] : arguments;

		for (var i = 0, length = callbackNames.length; i < length; i++) {
			this._createCallback(callbackNames[i]);
		}
	},

	fullfill: function() {
		if (arguments.length === 0) {
			throw new Error("The first argument to Promise#fullfill must be the name of the promise to fullfill");
		}

		var name = arguments[0];
		var args = Array.prototype.slice.call(arguments, 1, arguments.length) || [];
		var context = this._context || this._promiser;

		args.push(this._promiser, this);

		if (this._callbacks[name]) {
			this._invokeCallback(name);
		}
		else {
			this._pendingCallbacks[name] = {
				context: context,
				args: args
			};
		}

		return this;
	},

	_handleError: function(error) {
		if (Promise.logger) {
			Promise.logger.error(error);
		}
		else {
			throw error;
		}
	},

	_invokeAfterCallbacks: function(name, args) {
		if (!this._afterCallbacks[name]) {
			return;
		}

		for (var i = 0, length = this._afterCallbacks[name].length; i < length; i++) {
			if (this._afterCallbacks[name][i].apply(this, args) === false) {
				return false;
			}
		}

		return true;
	},

	_invokeBeforeCallbacks: function(name, args) {
		if (!this._beforeCallbacks[name]) {
			return;
		}

		for (var i = 0, length = this._beforeCallbacks[name].length; i < length; i++) {
			if (this._beforeCallbacks[name][i].apply(this, args) === false) {
				return false;
			}
		}

		return true;
	},

	_invokeCallback: function(name) {
		var info = this._pendingCallbacks[name];

		try {
			if (!this._invokeBeforeCallbacks(name, [info])) {
				return;
			}

			func.apply(info.context, info.args);

			this._invokeAfterCallbacks(name, [info]);

			this._pendingCallbacks[name] = info = null;
		}
		catch (error) {
			this._handleError(error);
		}
	}

};

Promise.logger = window.console || null;
