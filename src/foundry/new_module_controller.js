Foundry.NewModuleController = function() {};

Foundry.NewModuleController.prototype = {

	controllerId: "newModules",

	dispatcher: null,

	document: null,

	frontController: null,

	moduleManager: null,

	constructor: Foundry.NewModuleController,

	destructor: function() {
		if (this.dispatcher) {
			this.dispatcher.unsubscribe(this);
		}

		if (this.frontController) {
			this.frontController.unregisterController(this);
		}

		this.dispatcher = this.document = this.moduleManager = this.frontController = null;
	},

	init: function() {
		this.dispatcher.subscribe(this.controllerId + ".createModule", this, "handleCreateModule");
		this.frontController.registerController(this);
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
	createModule: function click(event, element, params) {
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
	_createModuleFromConfig: function(config) {
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
		var template = this.document.querySelector(selector);
		var element = this.document.createElement(config.element.tag);

		if (!template) {
			throw new Error("Failed to find new module template using selector: " + selector);
		}

		if (config.container.selector) {
			container = this.document.querySelector(config.container.selector);
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

		element = template = config = container = null;

		return module;
	},

	handleCreateModule: function(event) {
		this._createModuleFromConfig(event.data);

		return false;
	},

	onControllerRegistered: function(frontController, controllerId) {
	},

	onControllerUnregistered: function(frontController) {
	}

};