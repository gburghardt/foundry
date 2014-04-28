/*! foundry 2014-05-02 */
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
