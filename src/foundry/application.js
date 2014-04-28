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
