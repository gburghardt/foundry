/*
 * File: bootstrap.js
 *
 * This file is responsible for setting up dependency injection,
 * instantiating your application, configuring your application, and kick
 * starting its lifecycle.
 *
 * There are five main parts:
 *
 * 1) Configure dependency injection - Define how all of the classes in your
 *    application are wired together.
 *
 * 2) Initialize dependency injection - Instantiate an object that will serve
 *    as your object factory, which will generate all other objects in your
 *    application (including the application itself!), and inject all of
 *    their dependencies.
 *
 * 3) Instantiate your application - Get an instance of your application from
 *    the object factory with all of its dependencies met.
 *
 * 4) Configure your application - Customize how your application behaves.
 *    You may also set class level configs for any other classes.
 *
 * 5) Init your application - Make your application ready to receive input
 *    from the user and react to the user's actions. This will kick start
 *    the creation of other modules on the page. From this point on control
 *    is handed over to the user.
 */

(function(window, document) {

	// 1) Configure dependency injection:
	var DependencyConfig = {
		application: {
			className: "Application",
			singleton: true,
			properties: {
				config: { id: "applicationConfig" },
				delegator: { id: "delegator" },
				eventDispatcher: { id: "globalEventDispatcher" },
				moduleManager: { id: "moduleManager" },
				objectFactory: { id: "objectFactory" }
			}
		},
		applicationConfig: {
			className: "Hash",
			singleton: true,
			constructorArgs: [{
				value: {
					// Global default application configs go here

					// Error handling:
					handleActionErrors: true,
					handleApplicationErrors: true,

					// Modules
					eagerLoadModules: true,
					lazyLoadModules: true
				}
			}]
		},
		delegator: {
			className: "dom.events.Delegator"
		},
		elementStore: {
			className: "ElementStore"
		},
		globalEventDispatcher: {
			className: "Events.Dispatcher",
			singleton: true
		},
		module: {
			abstract: true,
			properties: {
				delegator: { id: "delegator" },
				elementStore: { id: "elementStore" },
				eventDispatcher: { id: "globalEventDispatcher" },
				options: { id: "moduleOptions" }
			}
		},
		moduleFactory: {
			className: "Module.Factory",
			singleton: true,
			properties: {
				objectFactory: { id: "objectFactory" }
			}
		},
		moduleManager: {
			className: "Module.Manager",
			singleton: true,
			properties: {
				factory: { id: "moduleFactory" }
			}
		},
		moduleOptions: {
			className: "Hash",
			constructorArgs: [{
				value: {
					// Global default module options go here
				}
			}]
		}
		/*
		Sample configs for specific modules:

		simpleTaskListModule: {
			className: "MyNamespace.TaskListModule",
			parent: "module"
		},

		advancedTaskListModule: {
			className: "MyNamespace.TaskListModule",
			parent: "module",
			constructorArgs: [{ // new MyNamespace.TaskListModule({}, 300);
				{ id: "foo" },
				{ value: 300 }
			}],
			properties: {
				selectionManager: { id: "selectionManager" }
			}
		}

		*/
	};

	// 2) Initialize dependency injection
	var objectFactory = new Hypodermic(DependencyConfig);

	// 3) Instantiate your application
	var app = objectFactory.getInstance("application");

	// 4) Configure your application
	app.configure(function(config) {
		// Custom config settings go here
		config.handleApplicationErrors = true;
	});

	// 5) Init your application
	window.onload = function() {
		app.init(document);
	};

})(window, document);
