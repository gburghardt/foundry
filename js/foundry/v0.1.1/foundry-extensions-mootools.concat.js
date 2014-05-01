/*! foundry 2014-04-29 */
ElementStore.MootoolsAdapter = {

	prototype: {

		querySelector: function querySelector(selector, element) {
			return $(element || this._root).getFirst(selector);
		},

		querySelectorAll: function querySelectorAll(selector, element) {
			return $(element || this._root).getChildren(selector);
		}

	}

};

ElementStore.include(ElementStore.MootoolsAdapter);
