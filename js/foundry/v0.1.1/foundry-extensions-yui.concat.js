/*! foundry 2014-04-29 */
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
