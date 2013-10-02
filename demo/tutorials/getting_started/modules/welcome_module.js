var WelcomeModule = Module.extend({
	prototype: {
		options: {
			backgroundColor: "#ffcc99"
		},

		_ready: function() {
			Module.prototype._ready.call(this);

			this.element.innerHTML = '<p>Welcome!</p>';
			this.element.style.backgroundColor = this.options.backgroundColor;
		}
	}
});
