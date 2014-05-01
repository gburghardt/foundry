var PeekABooModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.element.innerHTML = "<p>Peek-a-boo!</p>";
			setTimeout(this._loaded.bind(this), 3000);
		}
	}
});
