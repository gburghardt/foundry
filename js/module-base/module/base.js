(function(global) {

global.Module = global.Module || {};

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

global.Module.Base = Base;

})(this);