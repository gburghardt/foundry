ElementStore.PrototypeAdaptor = {

	prototype: {

		querySelector: function querySelector(selector, element) {
			return $(element || this._root).down(selector);
		},

		querySelectorAll: function querySelectorAll(selector, element) {
			return $(element || this._root).select(selector);
		}

	}

};

ElementStore.include(ElementStore.PrototypeAdaptor);
