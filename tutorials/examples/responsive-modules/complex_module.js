var ComplexModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = '<h1>I am WAAAAY too big for small screens</h1>';
			this._loaded();
		}
	}
});
