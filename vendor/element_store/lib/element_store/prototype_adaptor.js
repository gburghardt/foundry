ElementStore.PrototypeAdaptor = {

	prototype: {

		querySelector: function querySelector(selector) {
			return $(this.element).down(selector)[0];
		},

		querySelectorAll: function querySelectorAll(selector) {
			return $(this.element).down(selector);
		}

	}

};

ElementStore.include(ElementStore.PrototypeAdaptor);
