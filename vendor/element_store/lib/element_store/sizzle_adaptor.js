ElementStore.SizzleAdaptor = {

	prototype: {

		querySelector: function querySelector(selector, element) {
			return Sizzle(selector, element || this._root)[0];
		},

		querySelectorAll: function querySelectorAll(selector, element) {
			return Sizzle(selector, element || this._root);
		}

	}

};

ElementStore.include(ElementStore.SizzleAdaptor);
