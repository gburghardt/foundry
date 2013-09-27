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
var Application = Module.extend({
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

		handleError: function handleError(error) {
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
