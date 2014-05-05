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
				moduleObserver: "moduleObserver"
			}
		},
		moduleObserver: {
			type: "Module.FrontControllerModuleObserver",
			properties: {
				frontController: "frontController"
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
