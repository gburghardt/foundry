ElementStore.PropertyGetters = {
	prototype: {
		createCollectionGetter: function createCollectionGetter(key, propertyName) {
			Object.defineProperty(proto, propertyName, {
				enumerable: false,
				get: function() {
					return this.elementStore.getCollection(key);
				}
			});
		},

		createElementGetter: function createElementGetter(key, propertyName) {
			Object.defineProperty(proto, propertyName, {
				enumerable: false,
				get: function() {
					return this.elementStore.getElement(key);
				}
			});
		}
	}
};

if (!Object.defineProperty) {
	throw new Error("Cannot include mixin ElementStore.PropertyGetters. Missing required function: Object.defineProperty");
}

ElementStore.include(ElementStore.PropertyGetters);