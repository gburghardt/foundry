// @import Inherit.js
// @requires ElementStore

ElementStore.Utils = {
	prototype: {
		elementStore: {},

		destroyElementStore: function destroyElementStore() {
			if (this.elementStore) {
				this.elementStore.destructor();
				this.elementStore = null;
			}
		},

		initElementStore: function initElementStore(root) {
			if (!this.hasOwnProperty("elementStore")) {
				this.elementStore = new ElementStore();
			}

			this._compileElementStore();
			this._initGetters();
			this.elementStore.init(root);
		},

		_initGetters: function _initGetters() {
			if (this.__proto__.hasOwnProperty("__elementStoreGettersCreated__")) {
				return;
			}

			var key, propertyName, proto = this.__proto__;
			var elements = this.elementStore.config.elements;
			var collections = this.elementStore.config.collections;

			if (!this.createElementGetter) {
				this.createElementGetter = this._createElementGetter;
			}

			if (!this.createCollectionGetter) {
				this.createCollectionGetter = this._createCollectionGetter;
			}

			for (key in elements) {
				if (elements.hasOwnProperty(key)) {
					if (!proto[key]) {
						propertyName = key;
					}
					else if (!proto[key + "Element"]) {
						propertyName = key + "Element";
					}
					else {
						throw new Error("Cannot create element getter: " + key);
					}

					this.createElementGetter(key, propertyName);
				}
			}

			for (key in collections) {
				if (collections.hasOwnProperty(key)) {
					if (!proto[key]) {
						propertyName = key;
					}
					else if (!proto[key + "Collection"]) {
						propertyName = key + "Collection";
					}
					else {
						throw new Error("Cannot create collection getter: " + key);
					}

					this.createCollectionGetter(key, propertyName);
				}
			}

			proto.__elementStoreGettersCreated__ = true;

			elements = collections = proto = null;
		},

		clearElementStoreCache: function clearElementStoreCache() {
			this.elementStore.clearCache();
		},

		collection: function collection(key) {
			return this.elementStore.getCollection(key);
		},

		_compileElementStore: function _compileElementStore() {
			if (this.__proto__.hasOwnProperty("_compiledElementStore")) {
				// Use the cached config
				this.elementStore.setConfig(this.__proto__._compiledElementStore);

				return;
			}

			var proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("elementStore")) {
					this.elementStore.setConfig(proto.elementStore, true);
				}

				proto = proto.__proto__;
			}

			// Cache this config for later instances
			this.__proto__._compiledElementStore = this.elementStore.config;
		},

		_createCollectionGetter: function _createCollectionGetter(key, propertyName) {
			var getter = function collectionGetter() {
				return this.elementStore.getCollection(key);
			};

			this.__proto__[propertyName] = getter;
		},

		_createElementGetter: function _createElementGetter(key, propertyName) {
			var getter = function elementGetter() {
				return this.elementStore.getElement(key);
			};

			this.__proto__[propertyName] = getter;
		},

		element: function element(key) {
			return this.elementStore.getElement(key);
		}
	}
};
