/*! foundry 2014-02-05 */
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

(function ($) {

	ElementStore.jQueryAdapter = {

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

	ElementStore.include(ElementStore.jQueryAdapter);

})(jQuery);
