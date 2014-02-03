/*! foundry 2014-02-03 */
require(["dojo/dom", "dojo/on"], function(dom, on) {
	dom.events.Delegator.DojoAdaptor = {
		prototype: {
			addEventListener: function(element, eventType, callback) {
				callback.__handle__ = on(dom.byId(element), eventType, callback);
			},

			removeEventListener: function(element, eventType, callback) {
				callback.__handle__.remove();
				callback.__handle__ = null;
				delete callback.__handle__;
			},

			triggerEvent: function(type) {
				on.emit(this.node, type, {bubbles: true, cancelable: true});
			}
		}
	};

	if (Function.prototype.include) {
		dom.events.Delegator.include(dom.events.Delegator.DojoAdaptor);
	}
});

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
