ElementStore.ZeptoAdaptor = {

	prototype: {

		querySelector: function querySelector(selector) {
			return $(this.element).find(selector)[0];
		},

		querySelectorAll: function querySelectorAll(selector) {
			return $(this.element).find(selector);
		}

	}

};

ElementStore.include(ElementStore.ZeptoAdaptor);
