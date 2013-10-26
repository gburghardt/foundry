var DateCreatedModule = Module.Base.extend({
	prototype: {
		cancel: function click(event, element, params) {
			event.stop();
			this.destructor();
		}
	}
});
