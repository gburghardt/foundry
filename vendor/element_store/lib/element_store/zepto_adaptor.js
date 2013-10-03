ElementStore.ZeptoAdaptor = {

	prototype: {

		querySelector: function querySelector(selector) {
			return $(this._root).find(selector)[0];
		},

		querySelectorAll: function querySelectorAll(selector) {
			return $(this._root).find(selector);
		}

	}

};

ElementStore.include(ElementStore.ZeptoAdaptor);
