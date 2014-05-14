var GoldilocksModule = Module.Base.extend({
	prototype: {
		_loaded: function() {},

		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = '<p>I work well on any screen size. Not too big. Not too small. Not too complex. Not too simple.</p>';
		}
	}
});
