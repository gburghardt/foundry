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
