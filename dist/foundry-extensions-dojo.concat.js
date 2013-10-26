/*! foundry 2014-04-24 */
require(["dojo/dom", "dojo/query"], function(dom, query) {

	ElementStore.DojoAdapter = {

		prototype: {

			querySelector: function querySelector(selector, element) {
				return query(selector, element || this._root)[0];
			},

			querySelectorAll: function querySelectorAll(selector, element) {
				return query(selector, element || this._root);
			}

		}

	};

	ElementStore.include(ElementStore.ZeptoAdaptor);

});
