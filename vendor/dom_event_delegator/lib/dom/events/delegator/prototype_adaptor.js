dom.events.Delegator.PrototypeAdaptor = {
	prototype: {
		addEventListener: function(element, eventType, callback) {
			$(element).listen(eventType, callback);
		},

		removeEventListener: function(element, eventType, callback) {
			$(element).stopListening(eventType, callback);
		},

		triggerEvent: function(type) {
			$(this.node).fire(type);
		}
	}
};

if (Function.prototype.include) {
	dom.events.Delegator.include(dom.events.Delegator.PrototypeAdaptor);
}
