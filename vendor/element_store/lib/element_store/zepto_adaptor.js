ElementStore.ZeptoAdaptor = {

	prototype: {

		querySelector: function querySelector(selector, element) {
			return $(element || this._root).find(selector).eq(0);
		},

		querySelectorAll: function querySelectorAll(selector, element) {
			return $(element || this._root).find(selector);
		}

	}

};

ElementStore.include(ElementStore.ZeptoAdaptor);
