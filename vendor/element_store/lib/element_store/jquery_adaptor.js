(function ($) {

	ElementStore.jQueryAdaptor = {

		prototype: {

			parseHTML: function parseHTML(html) {
				return $(html);
			},

			querySelector: function querySelector(selector) {
				return $(this.element).find(selector).eq(0);
			},

			querySelectorAll: function querySelectorAll(selector) {
				return $(this.element).find(selector);
			}

		}

	};

	ElementStore.include(ElementStore.jQueryAdaptor);

})(jQuery);
