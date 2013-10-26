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
