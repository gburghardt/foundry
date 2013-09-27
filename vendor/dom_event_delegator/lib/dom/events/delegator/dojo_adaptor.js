require(["dojo/dom", "dojo/on"], function(dom, on) {
	dom.events.Delegator.DojoAdaptor = {
		prototype: {
			addEventListener: function(element, eventType, callback) {
				callback.__handle__ = on(dom.byId(element), eventType, callback);
			},

			removeEventListener: function(element, eventType, callback) {
				callback.__handle__.remove();
				callback.__handle__ = null;
				delete callback.__handle__;
			},

			triggerEvent: function(type) {
				on.emit(this.node, type, {bubbles: true, cancelable: true});
			}
		}
	};

	if (Function.prototype.include) {
		dom.events.Delegator.include(dom.events.Delegator.DojoAdaptor);
	}
});
