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
