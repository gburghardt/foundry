ElementStore.SizzleAdaptor = {

	prototype: {

		querySelector: function querySelector(selector) {
			return Sizzle(selector, this.element)[0];
		},

		querySelectorAll: function querySelectorAll(selector) {
			return Sizzle(selector, this.element);
		}

	}

};

ElementStore.include(ElementStore.SizzleAdaptor);
