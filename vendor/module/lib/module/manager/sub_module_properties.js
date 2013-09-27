Module.Manager.SubModuleProperties = {

	included: function included(Klass) {
		if (Klass.addCallback) {
			Klass.addCallback("beforeElementStoreInit", "addSubModuleElementStoreConfigs")
			Klass.addCallback("beforeReady", "initSubModules");
		}
	},

	prototype: {

		initSubModules: function initSubModules() {
			if (this.options.subModulesDisabled) {
				return;
			}

			var elements = this.elementStore.getCollection("subModules"),
			    i = 0, length = elements.length, name;

			for (i; i < length; i++) {
				name = elements[i].getAttribute("data-module-property");
				this._createSubModuleProperty(name, elements[i]);
			}
		},

		addSubModuleElementStoreConfigs: function addSubModuleElementStoreConfigs() {
			this.elementStore.setConfig({
				collections: {
					subModules: { selector: "[data-module-property]", nocache: true }
				}
			});
		},

		_createSubModuleProperty: function _createSubModuleProperty(name, element) {
			if (!name) {
				throw new Error("Missing required argument: name");
			}
			else if (!element) {
				throw new Error("Missing required argument: element");
			}

			var manager = this.constructor.getManager();
			var metaData = manager.getModuleMetaData(element);
			var module, proto = this.constructor.prototype;

			if (metaData.types.length > 1) {
				throw new Error("Sub module elements cannot have more than one type specified in data-module");
			}

			module = manager.createModule(element, metaData.types[0], metaData.options);
			module.init(element);

			if (proto[name] === null) {
				if (this.hasOwnProperty(name)) {
					throw new Error("Error creating sub module. Property " + name + " already exists.");
				}

				this[name] = module;
			}
			else if (proto[name] instanceof Array) {
				if (!this.hasOwnProperty(name)) {
					this[name] = [];
				}

				this[name].push(module);
			}
			else {
				throw new Error("Cannot create module property " + name + ". Property is neither null nor an Array in the class Prototype.");
			}

			manager.markModulesCreated(element, metaData);

			manager = module = metaData = proto = element = null;
		}

	}

};

Module.include(Module.Manager.SubModuleProperties);
