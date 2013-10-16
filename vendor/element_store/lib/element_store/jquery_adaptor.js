(function ($) {

	ElementStore.jQueryAdaptor = {

		prototype: {

			parseHTML: function parseHTML(html) {
				return $(html);
			},

			querySelector: function querySelector(selector, element) {
				return $(element || this._root).find(selector).eq(0);
			},

			querySelectorAll: function querySelectorAll(selector, element) {
				return $(element || this._root).find(selector);
			}

		}

	};

	ElementStore.include(ElementStore.jQueryAdaptor);

})(jQuery);
