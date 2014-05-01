var EagerLoadedModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = "<p>Eager loaded!</p>";
			this.element.style.backgroundColor = "#90c0f0";
			this._loaded();
		}
	}
});
