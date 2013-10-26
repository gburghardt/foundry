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
