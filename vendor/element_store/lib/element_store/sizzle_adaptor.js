ElementStore.SizzleAdaptor = {

	prototype: {

		querySelector: function querySelector(selector) {
			return Sizzle(selector, this._root)[0];
		},

		querySelectorAll: function querySelectorAll(selector) {
			return Sizzle(selector, this._root);
		}

	}

};

ElementStore.include(ElementStore.SizzleAdaptor);
