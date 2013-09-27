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
