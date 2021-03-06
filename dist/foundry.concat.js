/*! foundry 2014-05-16 */
var Oxydizr = {};
Oxydizr.FrontController = function FrontController() {
	this.events = {};
	this.controllers = {};
	this.handleEvent = this.handleEvent.bind(this);
	this.handleEnterpress = this.handleEnterpress.bind(this);
}

Oxydizr.FrontController.prototype = {

	catchErrors: false,

	controllers: null,

	element: null,

	errorHandler: {
		handleError: function(error, controller, event, element, params, action, controllerId) {
			console.error(error);

			console.log({
				controller: controller,
				event: event,
				element: element,
				params: params,
				action: action,
				controllerId: controllerId
			});

			return true;
		}
	},

	events: null,

	constructor: Oxydizr.FrontController,

	destructor: function() {
		if (this.controllers) {
			for (var controllerId in this.controllers) {
				if (this.controllers.hasOwnProperty(controllerId)) {
					this.unregisterController(this.controllers[controllerId]);
					this.controllers[controllerId] = null;
				}
			}

			this.controllers = null;
		}

		if (this.events) {
			for (var eventName in this.events) {
				if (this.events.hasOwnProperty(eventName)) {
					this._removeEvent(this.element, eventName, this.events[eventName]);
				}
			}

			this.events = null;
		}

		this.element = null;
	},

	init: function(element) {
		if (element) {
			this.element = element;
		}

		if (!this.element) {
			throw new Error("Missing required argument: element");
		}

		// click and submit events are so common that we just subscribe to them
		this.registerEvents("click", "submit");

		return this;
	},

	_addEvent: function(element, eventName, eventInfo) {
		if (!this.events[eventName]) {
			this.events[eventName] = eventInfo;
			this._addEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
		}
	},

	_addEventListener: function(element, name, handler, capture) {
		element.addEventListener(name, handler, capture);
	},

	_createDelegateId: function() {
		var index = 1000;

		return function() {
			return String(++index);
		};
	}(),

	_getActions: function(element) {
		var actionsAttr = element.getAttribute("data-actions");

		if (!actionsAttr || /^\s*$/.test(actionsAttr)) {
			return [];
		}
		else {
			return actionsAttr
				.replace(/^\s+|\s+$/g, "")
				.split(/[.\s+]/g);
		}
	},

	_getMethodFromAction: function(controller, action, event) {
		var method = null;

		if (controller[action] && controller[action].name === (event.__type || event.type)) {
			method = action;
		}
		else if (controller.handleAction) {
			method = "handleAction";
		}

		return method;
	},

	_getParams: function(event, element) {
		var attr = element.getAttribute("data-action-params");

		return (attr) ? JSON.parse(attr) : {};
	},

	handleEnterpress: function(event) {
		if (event.keyCode === 13) {
			event.__type = "enterpress";
			this.handleEvent(event);
		}
	},

	_handleError: function(error, controller, controllerId, action, event, element, params) {
		if (controller && controller.handleActionError) {
			return controller.handleActionError(error, event, element, params, action, controller, controllerId);
		}
		else if (this.errorHandler) {
			return this.errorHandler.handleActionError(error, controller, event, element, params, action, controllerId);
		}

		return false;
	},

	handleEvent: function(event) {
		this._patchEvent(event);
		this._propagateEvent(event.target, event);
		this._unpatchEvent(event);
	},

	_invokeAction: function(controllerId, action, event, element, params) {
		var controller = this.controllers[controllerId] || null,
		    method = null;

		if (!controller) {
			event.stop();
			throw new Error("No controller registered for " + controllerId);
		}
		else if (method = this._getMethodFromAction(controller, action, event)) {
			if (this.catchErrors) {
				try {
					controller[method](event, element, params, action);
				}
				catch (error) {
					event.stop();

					if (!this._handleError(error, controller, controllerId, action, event, element, params)) {
						throw error;
					}
				}
			}
			else {
				controller[method](event, element, params, action);
			}
		}
	},

	_patchEvent: function(event) {
		event.__isStopped = false;
		event.__stopPropagation = event.stopPropagation;
		event.stopPropagation = function() {
			event.__stopPropagation();
			this.__isStopped = true;
		};
		event.__stop = event.stop || null;
		event.stop = function() {
			if (this.__stop) {
				this.__stop();
			}

			this.preventDefault();
			this.stopPropagation();
		};
	},

	_propagateEvent: function(element, event) {
		var actions = this._getActions(element),
		    params = this._getParams(event, element),
		    controllerId, action, actionParams;

		for (var i = 0, length = actions.length; i < length; i += 2) {
			controllerId = actions[i];
			action = actions[i + 1];
			actionParams = params[controllerId + "." + action] || {};
			this._invokeAction(controllerId, action, event, element, actionParams);

			if (event.__isStopped) {
				break;
			}
		}

		if (event.__isStopped || element === this.element) {
			// do nothing
		}
		else if (element.parentNode) {
			this._propagateEvent(element.parentNode, event);
		}
	},

	_registerEvent: function(eventName) {
		var eventInfo = {
			name: eventName,
			handler: this.handleEvent,
			capture: false
		};

		if (eventName === "enterpress") {
			eventInfo.name = "keypress";
			eventInfo.handler = this.handleEnterpress;
		}
		else if (eventName === "focus" || eventName === "blur") {
			eventInfo.capture = true;
		}

		this._addEvent(this.element, eventName, eventInfo);
	},

	registerEvents: function() {
		for (var i = 0, length = arguments.length; i < length; i++) {
			this._registerEvent(arguments[i]);
		}

		return this;
	},

	registerController: function(controller) {
		var controllerId = controller.controllerId || (controller.controllerId = this._createDelegateId());

		if (this.controllers[controllerId]) {
			throw new Error("Cannot register duplicate delegate Id: " + controllerId);
		}

		this.controllers[controllerId] = controller;

		controller.onControllerRegistered(this, controllerId);

		return controllerId;
	},

	_removeEvent: function(element, eventName, eventInfo) {
		if (this.events[eventName]) {
			this._removeEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
			this.events[eventName] = this.events[eventName].handler = null;
		}
	},

	_removeEventListener: function(element, name, handler, capture) {
		element.removeEventListener(name, handler, capture);
	},

	_unpatchEvent: function(event) {
		event.stopPropagation = event.__stopPropagation;
		event.stop = event.__stop || null;
		event.__stop = event.__stopPropagation = event.__isStopped = null;
	},

	unregisterController: function(controller) {
		var controllerId = controller.controllerId;

		if (!controllerId || !this.controllers[controller.controllerId]) {
			return false;
		}
		else {
			this.controllers[controller.controllerId] = null;
			delete this.controllers[controller.controllerId];
			controller.onControllerUnregistered(this);
			return true;
		}
	}

};
this.Hypodermic = {};

(function(global) {

var globals = [
	"applicationCache",
	"console",
	"document",
	"localStorage",
	"location",
	"navigator",
	"screen",
	"sessionStorage"
], globalSingletons = { global: global };

for (var i = 0, key, length = globals.length; i < length; i++) {
	key = globals[i];

	if (key in global) {
		try {
			globalSingletons[key] = global[key];
		}
		catch (error) {
			var message = "Cannot seed global singletons with " + key + ". Failed with error: " + error.message;

			if (global.console && global.console.warn) {
				global.console.warn(message);
			}
			else {
				setTimeout(function() {
					throw message;
				}, 500);
			}
		}
	}
}

function Container(_configs) {

	if (!_configs) {
		throw new Error("Missing required argument: configs");
	}

	var _dependencyResolver = new Hypodermic.DependencyResolver(this),
	    _objectFactory = new Hypodermic.ObjectFactory(this, _dependencyResolver),
	    _singletons = Object.create(globalSingletons);

	_singletons.container = this;

	this.resolve = function(name, unsafe) {
		var instance = null,
		    config = _configs[name],
		    propertiesSet = {};

		if (_singletons[name]) {
			instance = _singletons[name];
		}
		else if (!config) {
			if (unsafe) {
				throw new Error("No configuration found for " + name);
			}
		}
		else if (config.template) {
			throw new Error("Cannot create resolve template config: " + name);
		}
		else {
			if (config.factory) {
				instance = _objectFactory.createInstanceFromFactory(config);
			}
			else {
				instance = _objectFactory.createInstance(config, config.constructorArgs);
			}

			if (config.singleton) {
				_singletons[name] = instance;
			}

			_dependencyResolver.injectDependencies(instance, config, propertiesSet);

			while (config = _configs[config.parent]) {
				_dependencyResolver.injectDependencies(instance, config, propertiesSet);
			}
		}

		return instance;
	};
}

global.Hypodermic.Container = Container;

})(this);

(function (global) {

function DependencyResolver(container) {
	this.container = container;
}

DependencyResolver.prototype = {

	container: null,

	constructor: DependencyResolver,

	findDependency: function(info) {
		var instance = null, factory;

		if (isString(info)) {
			instance = this.container.resolve(info, true);
		}
		else if ("value" in info) {
			instance = info.value;
		}
		else {
			throw new Error("No dependency value found. Missing one of 'id', 'value' or 'factory'");
		}

		return instance;
	},

	injectDependencies: function(instance, config, propertiesSet) {
		if (!config.properties) {
			return;
		}

		var properties = config.properties,
		    key, dependency, setter;

		for (key in properties) {
			if (properties.hasOwnProperty(key) && !propertiesSet[key]) {
				setter = "set" + capitalize(key);
				dependency = this.findDependency(properties[key]);

				if (isFunction(instance[setter])) {
					instance[setter](dependency);
				}
				else {
					instance[key] = dependency;
				}

				propertiesSet[key] = true;
			}
		}
	}

};

global.Hypodermic.DependencyResolver = DependencyResolver;

// utils

var toString = Object.prototype.toString;

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.substring(1, str.length);
}

function isFunction(x) {
	return toString.call(x) === "[object Function]";
}

function isString(x) {
	return toString.call(x) === "[object String]";
}

})(this);

(function(global) {

function ObjectFactory(container, dependencyResolver) {
	this.container = container;
	this.dependencyResolver = dependencyResolver;
}

ObjectFactory.prototype = {

	container: null,

	dependencyResolver: null,

	constructor: ObjectFactory,

	createInstance: function(config, constructorDependencies) {
		if (!config.type) {
			throw new Error("Missing required argument: config.type");
		}

		var Klass = this._getClassReference(config.type),
		    instance = null,
		    args = null;

		if (!Klass) {
			throw new Error("Class " + config.type + " not found.");
		}
		else if (Klass.constructor === Function) {
			instance = Object.create(Klass.prototype);

			if (constructorDependencies) {
				args = this._getConstructorArgs(constructorDependencies);
				Klass.apply(instance, args);
			}
			else {
				Klass.call(instance);
			}
		}
		else {
			// object singleton/static class
			instance = Klass;
		}

		return instance;
	},

	createInstanceFromFactory: function(config) {
		if (!config.factory.id) {
			throw new Error("Missing required argument: config.factory.id");
		}

		var factoryInfo = config.factory,
		    factory = this.container.resolve(factoryInfo.id, true),
		    method = factoryInfo.method || "createInstance",
		    args = [], dependency, i, length;

		if (factoryInfo.args && factoryInfo.args.length) {
			for (i = 0, length = factoryInfo.args.length; i < length; i++) {
				args.push(this.dependencyResolver.findDependency(factoryInfo.args[i]));
			}
		}
		else {
			args.push(factoryInfo.type);
		}

		if (!factory[method]) {
			throw new Error("No method called " + method + " exists on the factory object registered as " + factoryInfo.id);
		}

		dependency = factory[method].apply(factory, args);

		return dependency;
	},

	_getClassReference: function(className) {
		var Klass = _classCache[className] || null;

		if (!Klass && /^[a-zA-Z][\w.$]+$/.test(className)) {
			try {
				Klass = global.eval(className);
			}
			catch (error) {
				Klass = null;
			}
		}

		if (Klass) {
			_classCache[className] = Klass;
		}

		return Klass;
	},

	_getConstructorArgs: function(dependencies) {
		var args = [];

		for (var i = 0, length = dependencies.length; i < length; i++) {
			args.push(this.dependencyResolver.findDependency(dependencies[i]));
		}

		return args;
	}

};

global.Hypodermic.ObjectFactory = ObjectFactory;

// Seed the class cache with some defaults
var _classCache = {};

var conditionalClasses = [
	"Array",
	"Boolean",
	"Date",
	"document",
	"DocumentFragment",
	"DOMParser",
	"Error",
	"FileReader",
	"Function",
	"location",
	"navigator",
	"Number",
	"Object",
	"RegExp",
	"String",
	"XMLHttpRequest"
];

var i, length, x;

for (i = 0, length = conditionalClasses.length; i < length; i++) {
	x = conditionalClasses[i];

	if (global[x] !== undefined) {
		_classCache[x] = global[x];
	}
}

})(this);

/*! module-manager 2014-05-16 */
/*! module-manager 2014-05-16 */
this.Module = this.Module || {};
(function() {

function Factory() {};

Factory.prototype = {

	objectFactory: null,

	constructor: Factory,

	destructor: function() {
		this.objectFactory = null;
	},

	getInstance: function(type) {
		var instance = null, Klass = null;

		if (this.objectFactory) {
			instance = this.objectFactory.getInstance(type);
		}

		if (!instance) {
			if (/^[a-zA-Z][a-zA-Z0-9.]+[a-zA-Z0-9]$/.test(type)) {
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
		}

		return instance;
	}

};

Module.Factory = Factory;

})();

(function() {

function Manager() {};

Manager.prototype = {

	baseClassName: "module",

	defaultModule: null,

	defaultModuleFocused: false,

	moduleObserver: {
		onModuleCreated: function(module, element, type) {},
		onSubModuleCreated: function(module, element, type) {},
		onModuleRegistered: function(module, type) {},
		onModuleUnregistered: function(module) {}
	},

	provider: null,

	registry: null,

	groups: null,

	constructor: Module.Manager,

	destructor: function(cascadeDestroy) {
		if (Module.manager === this) {
			Module.manager = null;
		}

		if (this.registry) {
			this._destroyRegistry(cascadeDestroy);
		}

		if (this.groups) {
			this._destroyGroups();
		}

		if (this.provider) {
			if (cascadeDestroy) {
				this.provider.destructor();
			}

			this.provider = null;
		}

		if (this.lazyLoader) {
			this.lazyLoader.destructor();
			this.lazyLoader = null;
		}
	},

	_destroyGroups: function() {
		var key, group, i, length;

		for (key in this.groups) {
			if (this.groups.hasOwnProperty(key)) {
				group = this.groups[key];

				for (i = 0, length = group.length; i < length; i++) {
					group[i] = null;
				}

				this.groups[key] = null;
			}
		}

		this.groups = null;
	},

	_destroyRegistry: function(cascadeDestroy) {
		var key, entry;

		for (key in this.registry) {
			if (this.registry.hasOwnProperty(key)) {
				entry = this.registry[key];
				this.moduleObserver.onModuleUnregistered(entry.module);

				if (cascadeDestroy) {
					entry.module.destructor(true);
				}

				entry.module = null;
				this.registry[key] = null;
			}
		}

		this.registry = null;
	},

	init: function() {
		this.provider = this.provider || new Module.Provider();
		this.provider.factory = this.provider.factory || new Module.Factory();
		this.provider.manager = this;
		this.provider.moduleObserver = this.moduleObserver;
		this.registry = this.registry || {};
		this.groups = this.groups || {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function(element) {
		var els = element.querySelectorAll("[data-modules]"),
			i = 0;

		for (i; i < els.length; i++) {
			this.createModules(els[i]);
		}

		els = null;

		return this;
	},

	lazyLoadModules: function(element, options) {
		this.lazyLoader = (this.lazyLoader || new Module.LazyLoader())
			.setManager(this)
			.setElement(element)
			.setOptions(options)
			.init();

		element = options = null;

		return this;
	},

	createModule: function(element, type, options, register) {
		var module = this.provider.createModule(element, type, options);

		if (register) {
			this.registerModule(type, module);
		}

		element = options = null;

		return module;
	},

	createModules: function(element, lazyLoad) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}
		else if (!lazyLoad && element.getAttribute("data-module-lazyload")) {
			return [];
		}
		else if (element.getAttribute("data-module-property")) {
			return [];
		}

		var metaData = new Module.MetaData(element),
		    modules = [];

		if (metaData.mediaMatches()) {
			this.provider.createModules(metaData, function(module, element, type, options) {
				modules.push(module);
				this.registerModule(type, module);
				module.init();
			}, this);

			this.markModulesCreated(element, metaData);
		}

		metaData = element = null;

		return modules;
	},

	focusDefaultModule: function(anything) {
		if (this.defaultModule && !this.defaultModuleFocused) {
			this.defaultModuleFocused = true;
			this.defaultModule.focus(anything);
		}
	},

	initModuleInContainer: function(element, container, config, template, type, module) {
		var createdAt = new Date();
		var renderData = {
			guid: module.guid,
			createdAt: createdAt,
			timestamp: createdAt.getTime(),
			controllerId: module.controllerId
		}, key;

		if (config.renderData) {
			for (key in config.renderData) {
				if (config.renderData.hasOwnProperty(key)) {
					renderData[key] = config.renderData[key];
				}
			}
		}

		var html = template.innerHTML.replace(/#\{([-.\w]+)\}/g, function(match, key) {
			return renderData[key] || "";
		});

		element.className += (" " + this.baseClassName + " " + config.className).replace(/\s{2,}/g, " ");
		element.innerHTML = html;

		if (config.insert === "top" && container.firstChild) {
			container.insertBefore(element, container.firstChild);
		}
		else {
			container.appendChild(element);
		}

		this.registerModule(type, module);
		module.init();

		if (config.autoFocus) {
			module.focus(!!config.autoFocusAnything);
		}
	},

	markModulesCreated: function(element, metaData) {
		element.setAttribute("data-modules-created", metaData.types.join(" "));
		element.removeAttribute("data-modules");
		element = metaData = null;
	},

	registerModule: function(type, module) {
		if (module.guid === undefined || module.guid === null) {
			throw new Error("Cannot register module " + type + " without a guid property");
		}
		else if (this.registry[module.guid]) {
			throw new Error("Module " + module.guid + " has already been registered");
		}

		this.registry[module.guid] = {module: module, type: type};

		if (!this.groups[type]) {
			this.groups[type] = [];
		}

		this.groups[type].push(module);
		this.moduleObserver.onModuleRegistered(module, type);

		module = null;
	},

	unregisterModule: function(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return false;
		}

		var guid = module.guid,
		    type = this.registry[guid].type,
		    group = this.groups[type],
		    unregistered = false;

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					unregistered = true;
					this.moduleObserver.onModuleUnregistered(module);
					break;
				}
			}
		}

		module = group = null;

		return unregistered;
	},

	setDefaultModule: function(module) {
		if (!this.defaultModule) {
			this.defaultModule = module;
		}

		module = null;
	}

};

Module.Manager = Manager;

})();

(function(g) {

	function MetaData(element) {
		this.options = null;
		this.types = [];

		if (element) {
			this.setElement(element);
		}
	}

	MetaData.prototype = {

		element: null,

		media: null,

		options: null,

		types: null,

		constructor: MetaData,

		forEach: function(callback, context) {
			var i = 0, length = this.types.length,
			    result, type, options;

			if (length === 1) {
				callback.call(context, this.element, this.types[0], this.options, 0, this);
			}
			else {
				for (i; i < length; ++i) {
					type = this.types[i];
					options = this.options[type] || {};
					result = callback.call(context, this.element, type, options, i, this);

					if (result === false) {
						break;
					}
				}
			}
		},

		mediaMatches: function() {
			if (!g.matchMedia) {
				throw new Error("This browser does not support JavaScript media queries. Please include a polyfill (https://github.com/paulirish/matchMedia.js)");
			}

			return this.media === null || g.matchMedia(this.media).matches;
		},

		setElement: function(element) {
			this.element = element;

			var types = element.getAttribute("data-modules"),
			    options = element.getAttribute("data-module-options");

			if (!types) {
				throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
			}

			this.types = types
				.replace(/^\s+|\s+$/g, "")
				.split(/\s+/g);

			this.options = options ? JSON.parse(options) : {};
			this.media = element.getAttribute("data-module-media");
		}

	};

	g.Module.MetaData = MetaData;

})(this);

(function() {

function Provider() {}

Provider.prototype = {

	factory: null,

	manager: null,

	moduleObserver: null,

	subModulesEnabled: true,

	constructor: Provider,

	destructor: function(cascadeDestroy) {
		if (cascadeDestroy && this.factory) {
			this.factory.destructor();
		}

		this.factory = this.manager = null;
	},

	_createModuleClass: function(type) {
		return "module " + type.charAt(0).toLowerCase() + type.slice(1, type.length)
			.replace(/(\.[A-Z])/g, function(match, $1) {
				return "-" + $1.replace(/\./g, "").toLowerCase();
			})
			.replace(/Module$/, "")
			.replace(/^\s+|\s+$/g, "");
	},

	createModule: function(element, type, options) {
		var module = this.factory.getInstance(type);
		var className = this._createModuleClass(type);

		element.className += element.className ? " " + className : className;

		module.setElement(element);
		module.setOptions(options);

		if (options.defaultModule) {
			this.manager.setDefaultModule(module);
		}

		this.moduleObserver.onModuleCreated(module, element, type);

		if (this.subModulesEnabled && !options.subModulesDisabled) {
			this._createSubModules(module);
		}

		return module;
	},

	createModules: function(metaData, callback, context) {
		var modules = [],
		    module,
		    callback = callback || function() {};

		metaData.forEach(function(element, type, options) {
			module = this.createModule(element, type, options);
			modules.push(module);
			callback.call(context, module, element, type, options);
		}, this);

		callback = context = module = null;

		return modules;
	},

	_createSubModules: function(module) {
		var els = module.element.getElementsByTagName("*"),
		    length = els.length,
		    i = 0, element, name;

		for (i; i < length; i++) {
			element = els[i];
			name = element.getAttribute("data-module-property");

			if (name) {
				this._createSubModuleProperty(module, name, element);
			}
		}
	},

	_createSubModuleProperty: function(parentModule, name, element) {
		var metaData = new Module.MetaData(element),
		   subModule;

		if (metaData.types.length > 1) {
			throw new Error("Sub module elements cannot have more than one type specified in data-modules");
		}

		subModule = this.createModule(element, metaData.types[0], metaData.options);
		this.moduleObserver.onSubModuleCreated(subModule, element, metaData.types[0]);
		subModule.init();

		if (parentModule[name] === null) {
			parentModule[name] = subModule;
		}
		else if (parentModule[name] instanceof Array) {
			if (!parentModule.hasOwnProperty(name)) {
				parentModule[name] = [];
			}

			parentModule[name].push(subModule);
		}
		else {
			throw new Error("Cannot create sub module property '" + name + "'. Property is neither null nor an Array on the parent module.");
		}

		this.manager.markModulesCreated(element, metaData);

		subModule = metaData = element = null;
	}

};

Module.Provider = Provider;

})();

/*! module-manager 2014-05-16 */
Module.FrontControllerModuleObserver = function FrontControllerModuleObserver(frontController) {
	this.frontController = frontController || null;
};

Module.FrontControllerModuleObserver.prototype = {

	frontController: null,

	constructor: Module.FrontControllerModuleObserver,

	_ensureControllerId: function(module) {
		module.controllerId = module.controllerId
		                   || module.options.controllerId
		                   || module.guid;
	},

	onModuleCreated: function(module, element, type) {
		this._ensureControllerId(module);
	},

	onSubModuleCreated: function(module, element, type) {
		this.frontController.registerController(module);
	},

	onModuleRegistered: function(module, type) {
		this.frontController.registerController(module);
	},

	onModuleUnregistered: function(module) {
		this.frontController.unregisterController(module);
	}

};
/*! module-manager 2014-05-16 */
/*! browser-viewport 2014-05-16 */
function Viewport(_window) {
	if (!_window) {
		throw new Error("Missing required argument: window");
	}

	// Private Properties

	var self = this,
	    _events = {
	    	"resize:complete": {
	    		type: "resize",
	    		handle: null,
	    		useCapture: false,
	    		bound: false,
	    		listeners: [],
	    		element: _window
	    	},
	    	"scroll:complete": {
	    		type: "scroll",
	    		handle: null,
	    		useCapture: false,
	    		bound: false,
	    		listeners: [],
	    		element: _window.document
	    	}
	    },
	    _eventListenerDelay = 20,
	    _orientation = _window.orientation || this.height > this.width ? 0 : 90;
	    _orientationEvent = {
	    	mql: _window.matchMedia ? _window.matchMedia("(orientation: portrait)") : null,
	    	regex: /^orientation:\w+$/i,
	    	listeners: {
	    		count: 0,
		    	"orientation:change": [],
		    	"orientation:portrait": [],
		    	"orientation:landscape": []
		    },
	    	test: function(type) {
	    		return this.regex.test(type)
	    		    && !!this.listeners[type];
	    	}
	    },
	    _resizeTimer = null,
	    _resizeTimeout = 300,
	    _scrollTimer = null,
	    _scrollTimeout = 300,
	    createAccessor = function(name, get, set) {
	    	Object.defineProperty(self, name, {
	    		enumerable: true,
	    		get: get,
	    		set: set
	    	});
	    },
	    createGetter = function(name, get) {
	    	Object.defineProperty(self, name, {
	    		enumerable: true,
	    		get: get
	    	});
	    };

	// Public Properties

	createGetter("bottom", function() {
		return _window.pageYOffset + _window.innerHeight;
	});

	createGetter("document", function() {
		return _window.document;
	});

	createAccessor("eventListenerDelay",
		function() {
			return _eventListenerDelay;
		},
		function(value) {
			_eventListenerDelay = value;
		}
	);

	createGetter("height", function() {
		return _window.innerHeight;
	});

	createGetter("left", function() {
		return _window.pageXOffset;
	});

	createGetter("location", function() {
		return _window.location;
	});

	createGetter("orientation", function() {
		return _orientation;
	});

	createAccessor("resizeTimeout",
		function() {
			return _resizeTimeout;
		},
		function(value) {
			_resizeTimeout = value;
		}
	);

	createGetter("right", function() {
		return _window.pageXOffset + _window.innerWidth;
	});

	createGetter("screen", function() {
		return _window.screen;
	});

	createAccessor("scrollTimeout",
		function() {
			return _scrollTimeout;
		},
		function(value) {
			_scrollTimeout = value;
		}
	);

	createGetter("top", function() {
		return _window.pageYOffset;
	});

	createGetter("width", function() {
		return _window.innerWidth;
	});

	createGetter("window", function() {
		return _window;
	});

	// Public Methods

	this.destructor = function() {
		if (_resizeTimer) {
			_window.clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		if (_scrollTimer) {
			_window.clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		removeSpecialEvent(_events["resize:complete"]);
		removeSpecialEvent(_events["scroll:complete"]);

		self = _events = _window = null;
	};

	this.addEventListener = function(type, listener) {
		type = type.toLowerCase();

		var event, listeners;

		if (_orientationEvent.test(type)) {
			listeners = _orientationEvent.listeners;

			if (!listeners.count && _orientationEvent.mql) {
				_orientationEvent.mql.addListener(handleOrientationChangeEvent);
			}

			listeners[type].push(listener);
			listeners.count++;
		}
		else if (event = _events[type]) {
			addSpecialEvent(event);
			event.listeners.push(listener);
		}
	};

	this.removeEventListener = function(type, listener) {
		type = type.toLowerCase();

		var event, index, listeners;

		if (_orientationEvent.test(type)) {
			listeners = _orientationEvent.listeners[type];
			index = listeners.indexOf(listener);

			if (index > -1) {
				listeners.splice(index, 1);

				if (--listeners.count === 0 && _orientationEvent.mql) {
					_orientationEvent.mql.removeListener(handleOrientationChangeEvent);
				}
			}
		}
		else if (_events[type]) {
			event = _events[type];
			index = event.listeners.indexOf(listener);

			if (index > -1) {
				event.listeners.splice(index, 1);

				if (!event.listeners.length) {
					removeSpecialEvent(event);
				}
			}
		}
	};

	// Private Methods

	var addSpecialEvent = function(event) {
		if (event.bound) {
			return;
		}

		event.element.addEventListener(event.type, event.handle, event.useCapture);
		event.bound = true;
	},
	fireResizedEvent = function() {
		fireEvent(_events["resize:complete"].listeners);
	},
	fireScrollCompleteEvent = function() {
		fireEvent(_events["scroll:complete"].listeners);
	},
	fireEvent = function(listeners) {
		if (!listeners.length) {
			return;
		}

		var callback = function() {
			if (++i === listeners.length || listeners[i](self) === false) {
				return;
			}

			_window.setTimeout(callback, _eventListenerDelay);
		}, i = -1;

		callback();
	},
	handleOrientationChangeEvent = function(m) {
		_orientation = m.matches ? 0 : _window.orientation || 90;

		fireEvent(_orientationEvent.listeners["orientation:change"]);

		if (m.matches) {
			fireEvent(_orientationEvent.listeners["orientation:portrait"]);
		}
		else {
			fireEvent(_orientationEvent.listeners["orientation:landscape"]);
		}
	},
	handleResizeEvent = function(event) {
		if (_resizeTimer) {
			_window.clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		_resizeTimer = _window.setTimeout(fireResizedEvent, _resizeTimeout);
	},
	handleScrollEvent = function(event) {
		if (_scrollTimer) {
			_window.clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		_scrollTimer = _window.setTimeout(fireScrollCompleteEvent, _scrollTimeout);
	},
	removeSpecialEvent = function(event) {
		if (!event.bound) {
			return;
		}

		event.element.removeEventListener(event.type, event.handle, event.useCapture);
		event.bound = false;
	};

	_events["resize:complete"].handle = handleResizeEvent;
	_events["scroll:complete"].handle = handleScrollEvent;
}

Viewport.prototype = {

	constructor: Viewport,

	contains: function(element) {
		var their = this.getElementPosition(element),
		    my = this.getPosition();

		if (their.left < my.right
			&& their.right > my.left
			&& their.top < my.bottom
			&& their.bottom > my.top) {
			return true;
		}
		else {
			return false;
		}
	},

	getElementPosition: function(element) {
		var pos = {
			left:   element.offsetLeft,
			top:    element.offsetTop,
			width:  element.offsetWidth,
			height: element.offsetHeight
		};

		while (element = element.offsetParent) {
			pos.left += element.offsetLeft;
			pos.top += element.offsetTop;
		}

		pos.right = pos.left + pos.width;
		pos.bottom = pos.top + pos.height;

		return pos;
	},

	getPosition: function() {
		return {
			left:   this.left,
			top:    this.top,
			width:  this.width,
			height: this.height,
			right:  this.right,
			bottom: this.bottom
		};
	},

	is: function(x) {
		return this === x
		    || this.window === x
		    || this.screen === x
		    || this.document === x;
	},

	matchMedia: function(query) {
		return this.window.matchMedia
		     ? this.window.matchMedia(query)
		     : { matches: false };
	},

	querySelector: function(selector, callback, context) {
		var element = null;

		this.querySelectorAll(selector, function(el) {
			element = el;
			return false;
		});

		return element;
	},

	querySelectorAll: function(selector, callback, context) {
		callback = callback || function() {};
		context = context || this;

		var elements = this.document.body.querySelectorAll(selector),
		    i = 0, result, matches = [], element;

		for (i; i < elements.length; i++) {
			element = elements[i];

			if (this.contains(element)) {
				matches.push(element);

				if (result !== false) {
					result = callback.call(context, element, i, this);
				}
			}
		}

		return matches;
	},

	toString: function() {
		return "[object Viewport: " + this.location + "]";
	}

};

(function() {

function LazyLoader() {
	this.handleScrollComplete = this.handleScrollComplete.bind(this);
	this.handleResizeComplete = this.handleResizeComplete.bind(this);
	this.handleMouseover = this.handleMouseover.bind(this);
	this.options = {
		resizeTimeout: 0,
	    scrollTimeout: 0
	};
}
LazyLoader.prototype = {

	document: null,

	element: null,

	manager: null,

	options: null,

	viewport: null,

	window: null,

	constructor: LazyLoader,

	destructor: function() {
		if (this.viewport) {
			this.viewport.removeEventListener("scroll:complete", this.handleScrollComplete);
			this.viewport.removeEventListener("resize:complete", this.handleResizeComplete);
			this.viewport = null;
		}

		if (this.element) {
			this.element.removeEventListener("mouseover", this.handleMouseover, false);
			this.element = null;
		}

		this.document = this.window = this.options = this.manager = null;
	},

	init: function() {
		if (!this.viewport) {
			this.setViewport(new Viewport(window));
		}

		if (this.options.resizeTimeout > 0) {
			this.viewport.resizeTimeout = this.options.resizeTimeout;
		}

		if (this.options.scrollTimeout > 0) {
			this.viewport.scrollTimeout = this.options.scrollTimeout;
		}

		this.viewport.addEventListener("scroll:complete", this.handleScrollComplete);
		this.viewport.addEventListener("resize:complete", this.handleResizeComplete);
		this.element.addEventListener("mouseover", this.handleMouseover, false);

		this._initModulesInViewport();

		return this;
	},

	handleMouseover: function(event) {
		event = event || window.event;
		event.target = event.target || event.srcElement;

		if (event.target.getAttribute("data-module-lazyload")) {
			this._lazyLoadModules(event.target, event.type);
		}
	},

	handleScrollComplete: function(viewport) {
		this._initModulesInViewport();
	},

	handleResizeComplete: function(viewport) {
		this._initModulesInViewport();
	},

	_initModulesInViewport: function() {
		this.viewport.querySelectorAll("[data-module-lazyload]", function(element) {
			this._lazyLoadModules(element, "scrollto");
		}, this);
	},

	_lazyLoadModules: function(element, value) {
		var attr = element.getAttribute("data-module-lazyload");

		if (attr === "any" || new RegExp(value).test(attr)) {
			if (this.manager.createModules(element, true).length) {
				element.removeAttribute("data-module-lazyload");
				element.setAttribute("data-module-lazyloaded", attr);
			}
		}
	},

	setElement: function(element) {
		this.element = element;
		this.document = element.ownerDocument;
	    this.window = this.document.defaultView;
		return this;
	},

	setManager: function(manager) {
		this.manager = manager;
		return this;
	},

	setOptions: function(overrides) {
		if (overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					this.options[key] = overrides[key];
				}
			}
		}

		return this;
	},

	setViewport: function(viewport) {
		this.viewport = viewport;
		this.setElement(viewport.document.documentElement);
		return this;
	}

};

Module.LazyLoader = LazyLoader;

})();

var Foundry = {
	version: "0.1.1"
};

Foundry.run = function(callback) {
	callback = callback || function() {};

	var config = {
		application: {
			type: "Foundry.Application",
			singleton: true,
			properties: {
				container: "container",
				dispatcher: "eventDispatcher",
				frontController: "frontController",
				moduleManager: "moduleManager"
			}
		},
		viewport: {
			type: "Viewport",
			singleton: true,
			constructorArgs: [
				"global"
			]
		},
		frontController: {
			type: "Oxydizr.FrontController",
			singleton: true
		},
		eventDispatcher: {
			type: "Beacon.Dispatcher",
			singleton: true
		},
		objectFactory: {
			type: "Foundry.ModuleFactory",
			singleton: true,
			properties: {
				container: "container"
			}
		},
		moduleFactory: {
			type: "Module.Factory",
			singleton: true,
			properties: {
				objectFactory: "objectFactory"
			}
		},
		moduleProvider: {
			type: "Module.Provider",
			singleton: true,
			properties: {
				factory: "moduleFactory"
			}
		},
		moduleManager: {
			type: "Module.Manager",
			singleton: true,
			properties: {
				provider: "moduleProvider",
				moduleObserver: "moduleObserver",
				lazyLoader: "moduleLazyLoader"
			}
		},
		moduleObserver: {
			type: "Module.FrontControllerModuleObserver",
			properties: {
				frontController: "frontController"
			}
		},
		moduleLazyLoader: {
			type: "Module.LazyLoader",
			singleton: true,
			properties: {
				manager: "moduleManager",
				viewport: "viewport"
			}
		},
		module: {
			template: true,
			properties: {
				elementStore: "elementStore",
				eventDispatcher: "eventDispatcher"
			}
		},
		elementStore: {
			type: "ElementStore"
		},
		merge: function(overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					this[key] = overrides[key];
				}
			}

			return this;
		}
	};

	var options = { autoInit: true },
	    element = callback(config, options) || document.documentElement,
	    container = new Hypodermic.Container(config),
	    app = container.resolve("application");

	if (options.autoInit) {
		app.init(element, options);
	}
	else {
		app.setElement(element);
		app.setOptions(options);
	}

	return app;
};

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

Foundry.ApplicationEventsController = function(dispatcher) {
	this.dispatcher = dispatcher;
};

Foundry.ApplicationEventsController.prototype = {

	controllerId: "events",

	dispatcher: null,

	frontController: null,

	constructor: Foundry.ApplicationEventsController,

	destructor: function() {
		if (this.frontController) {
			this.frontController.unregisterController(this);
		}

		this.dispatcher = this.frontController = null;
	},

	onControllerRegistered: function(frontController, controllerId) {
		this.frontController = frontController;
	},

	onControllerUnregistered: function(frontController) {
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
	publishEvent: function click(event, element, params) {
		if (!params.event) {
			throw new Error("Missing required argument params.event");
		}

		event.stop();
		this.dispatcher.publish(params.event, element, params.data || {});
	}

};
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

Foundry.ModuleFactory = function ModuleFactory() {
}

Foundry.ModuleFactory.prototype = {

	container: null,

	constructor: Foundry.ModuleFactory,

	destructor: function() {
		this.container = null;
	},

	getInstance: function(type) {
		return this.container.resolve(type);
	}

};

Foundry.ModuleObserver = function(frontController) {
	this.frontController = frontController || null;
};

Foundry.ModuleObserver.prototype = {

	frontController: null,

	constructor: Foundry.ModuleObserver,

	destructor: function() {
		this.frontController = null;
	},

	onModuleCreated: function(module, element, type) {
		module.controllerId = module.options.controllerId || module.guid;
	},

	onModuleRegistered: function(module, type) {
		this.frontController.registerController(module);
	},

	onModuleUnregistered: function(module) {
		this.frontController.unregisterController(module);
	}

};

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