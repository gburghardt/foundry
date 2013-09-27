dom.events.Delegator.MooToolsAdaptor = {
	prototype: {
		addEventListener: function(element, eventType, callback) {
			document.id(element).addEvent(eventType, callback);
		},

		removeEventListener: function(element, eventType, callback) {
			document.id(element).removeEvent(eventType, callback);
		},

		triggerEvent: function(type) {
			$(this.node).fireEvent(type);
		}
	}
};

if (Function.prototype.include) {
	dom.events.Delegator.include(dom.events.Delegator.jQueryAdaptor);
}
