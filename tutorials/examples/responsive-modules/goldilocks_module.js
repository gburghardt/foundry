var GoldilocksModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = '<p>I work well on any screen size. Not too big. Not too small. Not too complex. Not too simple.</p>';
			this._loaded();
		}
	}
});
