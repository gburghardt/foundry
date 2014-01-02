/*! foundry 2014-01-02 */
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

ElementStore.YuiAdapter = {

	prototype: {

		querySelector: function querySelector(selector, element) {
			return (element || this._root).one(selector);
		},

		querySelectorAll: function querySelectorAll(selector, element) {
			return (element || this._root).all(selector);
		}

	}

};

ElementStore.include(ElementStore.YuiAdapter);
