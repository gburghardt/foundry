/*! foundry 2014-05-14 */
var AverageJoeModule = Module.Base.extend({
	prototype: {
		options: {
			backgroundColor: "#6c6"
		},

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.element.innerHTML = "<p>I am your average Joe!</p>";
			this.element.style.backgroundColor = this.options.backgroundColor;
		}
	}
});
