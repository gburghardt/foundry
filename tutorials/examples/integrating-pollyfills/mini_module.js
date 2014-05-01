var MiniModule = Module.Base.extend({
	prototype: {
		_loaded: function() {},

		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = '<p>I\'m only usefull on small screens.</p>';
		}
	}
});
