/*! foundry 2014-02-05 */
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

ElementStore.ZeptoAdapter = {

	prototype: {

		parseHTML: function parseHTML(html) {
			return $(html);
		},

		querySelector: function querySelector(selector, element) {
			return this.returnNative
				? $(element || this._root).find(selector)[0]
				: $(element || this._root).find(selector).eq(0);
		},

		querySelectorAll: function querySelectorAll(selector, element) {
			return $(element || this._root).find(selector);
		}

	}

};

ElementStore.include(ElementStore.ZeptoAdapter);
