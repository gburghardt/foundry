dom.events.Delegator.YuiAdaptor = {
	prototype: {
		addEventListener: function(element, eventType, callback) {
			Event.attach(eventType, element, callback);
		},

		removeEventListener: function(element, eventType, callback) {
			Event.detach(eventType, element, callback);
		},

		triggerEvent: function(type) {
			// TODO: does this work?
			Event.simulate(this.node, type);
		}
	}
};

if (Function.prototype.include) {
	dom.events.Delegator.include(dom.events.Delegator.YuiAdaptor);
}
