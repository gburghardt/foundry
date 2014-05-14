/*! foundry 2014-05-14 */
var ComplexModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = '<h1>I am WAAAAY too big for small screens</h1>';
			this._loaded();
		}
	}
});

var GoldilocksModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = '<p>I work well on any screen size. Not too big. Not too small. Not too complex. Not too simple.</p>';
			this._loaded();
		}
	}
});

var MiniModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.innerHTML = '<p>I\'m only usefull on small screens.</p>';
			this._loaded();
		}
	}
});
