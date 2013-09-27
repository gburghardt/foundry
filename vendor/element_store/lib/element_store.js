function ElementStore() {
}
ElementStore.prototype = {

	_cache: null,

	config: null,

	_document: null,

	_root: null,

	constructor: ElementStore,

	init: function init(root) {
		if (!root) {
			throw new Error("Missing required argument: root");
		}

		this.config = this.config || { elements: {}, collections: {} };
		this._cache = {};
		this.setRoot(root);

		if (!this.createElement) {
			this.createElement = this._createElement;
		}

		if (!this.parseHTML) {
			this.parseHTML = this._parseHTML;
		}

		if (!this.querySelector) {
			this.querySelector = this._querySelector;
		}

		if (!this.querySelectorAll) {
			this.querySelectorAll = this._querySelectorAll;
		}

		this.eagerLoad();

		return this;
	},

	destructor: function destructor() {
		if (this._cache) {
			this.clearCache();
			this._cache = null;
		}

		this.config = this._root = this._document = null;
	},

	clearCache: function clearCache() {
		var key;

		for (key in this._cache) {
			if (this._cache.hasOwnProperty(key)) {
				this._cache[key] = null;
			}
		}

		return this;
	},

	_createElement: function _createElement(tagName) {
		return this._document.createElement(tagName);
	},

	eagerLoad: function eagerLoad() {
		var key, conf;

		for (key in this.config.elements) {
			if (this.config.elements.hasOwnProperty(key)) {
				conf = this.config.elements[key];

				if (conf.eager && !conf.nocache) {
					this._cache[key] = this.getElement(key);
				}
			}
		}

		for (key in this.config.collections) {
			if (this.config.collections.hasOwnProperty(key)) {
				conf = this.config.collections[key];

				if (conf.eager && !conf.nocache) {
					this.getCollection(key);
				}
			}
		}

		return this;
	},

	get: function get(key) {
		return this.getElement(key) || this.getCollection(key) || null;
	},

	getCollection: function getCollection(key) {
		var collection;

		if (!this.config.collections[key]) {
			collection = null;
		}
		else if (this._cache[key]) {
			collection = this._cache[key];
		}
		else if (this.config.collections[key].selector) {
			collection = this.querySelectorAll(this.config.collections[key].selector);

			if (!this.config.collections[key].nocache) {
				this._cache[key] = collection;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for collection " + key);
		}

		return collection;
	},

	getElement: function getElement(key) {
		var element;

		if (!this.config.elements[key]) {
			element = null;
		}
		else if (this._cache[key]) {
			element = this._cache[key];
		}
		else if (this.config.elements[key].selector) {
			element = this.querySelector(this.config.elements[key].selector);

			if (!this.config.elements[key].nocache) {
				this._cache[key] = element;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for element " + key);
		}

		return element;
	},

	isCollection: function isCollection(key) {
		return this.config.collections.hasOwnProperty(key);
	},

	isElement: function isElement(key) {
		return this.config.elements.hasOwnProperty(key);
	},

	keys: function keys() {
		var keys = [], key;

		for (key in this.config.elements) {
			if (this.config.elements.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		for (key in this.config.collections) {
			if (this.config.collections.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		return keys;
	},

	_mergeConfigs: function _mergeConfigs(config, overrides, safe) {
		for (key in overrides) {
			if (overrides.hasOwnProperty(key) && (config[key] === undefined || !safe)) {
				config[key] = overrides[key];
			}
		}
	},

	_parseHTML: function _parseHTML(html) {
		html = html.replace(/^\s+|\s+$/g, "");
		var div = this.createElement("div");
		div.innerHTML = html;
		var elements = [], i = div.childNodes.length;

		while (i--) {
			elements.push(div.childNodes[i]);
			div.removeChild(div.childNodes[i]);
		}

		div = null;

		return elements;
	},

	setConfig: function setConfig(overrides, safe) {
		this.config = this.config || { elements: {}, collections: {} };

		if (overrides.elements) {
			this._mergeConfigs(this.config.elements, overrides.elements, safe)
		}

		if (overrides.collections) {
			this._mergeConfigs(this.config.collections, overrides.collections, safe)
		}

		return this;
	},

	setRoot: function setRoot(root) {
		this.clearCache();
		this._root = root;
		this._document = this._root.nodeName === "#document" ? this._root : this._root.ownerDocument;

		return this;
	},

	toString: function toString() {
		return "[object ElementStore]";
	},

	_querySelector: function _querySelector(selector) {
		return this._root.querySelector(selector);
	},

	_querySelectorAll: function _querySelectorAll(selector) {
		return this._root.querySelectorAll(selector);
	}

};
