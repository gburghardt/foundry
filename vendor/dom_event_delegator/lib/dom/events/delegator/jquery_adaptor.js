dom.events.Delegator.jQueryAdaptor = {
	prototype: {
		addEventListener: function(element, eventType, callback) {
			jQuery(element).bind(eventType, callback);
		},

		removeEventListener: function(element, eventType, callback) {
			jQuery(element).unbind(eventType, callback);
		},

		triggerEvent: function(type) {
			jQuery(this.node).trigger(type);
		}
	}
};

if (Function.prototype.include) {
	dom.events.Delegator.include(dom.events.Delegator.jQueryAdaptor);
}
