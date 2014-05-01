var WelcomeModule = Module.Base.extend({
	prototype: {
		options: {
			backgroundColor: "#ffcc99"
		},

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.element.innerHTML = '<p>Welcome!</p>';
			this.element.style.backgroundColor = this.options.backgroundColor;
		}
	}
});
