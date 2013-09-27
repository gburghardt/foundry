dom.events.Delegator.ZeptoAdaptor = {
	prototype: {
		addEventListener: function(element, eventType, callback) {
			$(element).bind(eventType, callback);
		},

		removeEventListener: function(element, eventType, callback) {
			$(element).unbind(eventType, callback);
		},

		triggerEvent: function(type) {
			$(this.node).trigger(type);
		}
	}
};

if (Function.prototype.include) {
	dom.events.Delegator.include(dom.events.Delegator.ZeptoAdaptor);
}
