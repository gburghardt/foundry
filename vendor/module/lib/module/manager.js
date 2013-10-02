// @requires module/factory.js

window.Module = window.Module || {};

Module.Manager = function Manager() {};

Module.Manager.prototype = {

	baseClassName: "module",

	defaultModule: null,

	defaultModuleFocused: false,

	factory: null,

	registry: null,

	groups: null,

	constructor: Module.Manager,

	destructor: function destructor(cascadeDestroy) {
		if (Module.manager === this) {
			Module.manager = null;
		}

		if (this.registry) {
			this._destroyRegistry(cascadeDestroy);
		}

		if (this.groups) {
			this._destroyGroups();
		}

		if (this.factory) {
			if (cascadeDestroy) {
				this.factory.destructor();
			}

			this.factory = null;
		}
	},

	_destroyGroups: function _destroyGroups() {
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

	_destroyRegistry: function _destroyRegistry(cascadeDestroy) {
		var key, entry;

		for (key in this.registry) {
			if (this.registry.hasOwnProperty(key)) {
				entry = this.registry[key];

				if (cascadeDestroy) {
					entry.module.destructor(true);
				}

				entry.module = null;
				this.registry[key] = null;
			}
		}

		this.registry = null;
	},

	init: function init() {
		this.factory = (this.hasOwnProperty("factory")) ? this.factory : new Module.Factory();
		this.registry = (this.hasOwnProperty("registry")) ? this.registry : {};
		this.groups = (this.hasOwnProperty("groups")) ? this.groups : {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function eagerLoadModules(element) {
		var els = element.getElementsByTagName("*"), i = 0, length = els.length;

		for (i; i < length; i++) {
			if (els[i].getAttribute("data-modules")) {
				this.createModules(els[i]);
			}
		}

		els = null;

		return this;
	},

	createModule: function createModule(element, type, options, register) {
		var className = element.className + " module " + type.charAt(0).toLowerCase() + type.slice(1, type.length).replace(/([.A-Z]+)/g, function(match, $1) {
			return "-" + $1.replace(/\./g, "").toLowerCase();
		});

		element.className = className.replace(/^\s+|\s+$/g, "");

		var module = this.factory.getInstance(type);

		module.setOptions(options);

		if (register) {
			this.registerModule(type, module);
		}

		element = options = null;

		return module;
	},

	createModules: function createModules(element) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}

		var metaData = this.getModuleMetaData(element);

		if (metaData.types.length === 1) {
			module = this.createModule(element, metaData.types[0], metaData.options, true);
			module.init(element, metaData.options);
		}
		else {
			for (i = 0, length = metaData.types.length; i < length; i++) {
				type = metaData.types[i];
				opts = metaData.options[type] || {};
				module = this.createModule(element, type, opts, true);
				module.init(element, opts);
			}
		}

		this.markModulesCreated(element, metaData);

		metaData = element = module = opts = options = null;
	},

	focusDefaultModule: function focusDefaultModule(anything) {
		if (this.defaultModule && !this.defaultModuleFocused) {
			this.defaultModuleFocused = true;
			this.defaultModule.focus(anything);
		}
	},

	getModuleMetaData: function getModuleMetaData(element) {
		var length;
		var types = element.getAttribute("data-modules");
		var options = element.getAttribute("data-module-options");
		var metaData = {
			element: element,
			types: null,
			options: null
		};

		if (!types) {
			throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
		}

		types = types.replace(/^\s+|\s+$/g, "").split(/\s+/g);
		length = types.length;
		options = (options) ? JSON.parse(options) : {};

		metaData.types = types;
		metaData.options = options;

		element = null;

		return metaData;
	},

	initModuleInContainer: function initModuleInContainer(element, container, config, template, type, module) {
		var createdAt = new Date();
		var renderData = new Hash({
			guid: module.guid,
			createdAt: createdAt,
			timestamp: createdAt.getTime()
		});

		if (config.renderData) {
			renderData.merge(config.renderData);
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

		module.init(element);
		this.registerModule(type, module);
	},

	markModulesCreated: function markModulesCreated(element, metaData) {
		element.setAttribute("data-modules-created", metaData.types.join(" "));
		element.removeAttribute("data-modules");
		element = metaData = null;
	},

	registerModule: function registerModule(type, module) {
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

		module = null;
	},

	unregisterModule: function unregisterModule(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return;
		}

		var guid = module.guid;
		var type = this.registry[guid].type;
		var group = this.groups[type];

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					break;
				}
			}
		}

		module = group = null;
	},

	setDefaultModule: function setDefaultModule(module) {
		if (!this.defaultModule) {
			this.defaultModule = module;
		}

		module = null;
	}

};
