Foundry.pollyfill = function() {
	return new Foundry.PollyfillPromise(Array.prototype.slice.call(arguments));
};

Foundry.PollyfillPromise = function PollyfillPromise(tests) {
	this.callbacks = { afterAll: [], afterEach: [] };
	this.tests = tests || [];
};

Foundry.PollyfillPromise.prototype = {

	callbacks: null,

	tests: null,

	constructor: Foundry.PollyfillPromise,

	afterAll: function(func, context) {
		this.callbacks.afterAll.push({func: func, context: context || null});
		return this;
	},

	afterEach: function(func, context) {
		this.callbacks.afterEach.push({func: func, context: context || null});
		return this;
	},

	fullfill: function() {
		var name = arguments[0],
		    args = Array.prototype.slice.call(arguments, 1),
		    callbacks = this.callbacks[name] || null,
		    callback, i, length;

		if (!name) {
			throw new Error("Missing required argument: name");
		}
		else if (!callbacks) {
			throw new Error("Cannot fullfill invalid promise: " + name);
		}

		for (i = 0, length = callbacks.length; i < length; i++) {
			callback = callbacks[i];
			callback.func.apply(callback.context, args);
		}
	},

	start: function() {
		throw new Error("Not Implemented!");
	}
};