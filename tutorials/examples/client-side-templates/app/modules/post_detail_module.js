var PostDetailModule = Module.Base.extend({
	prototype: {

		options: {
			post_id: 0,
			view: "post/detail"
		},

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			var xhr = new XMLHttpRequest(),
				data = null,
				that = this;

			xhr.onreadystatechange = function() {
				if (this.readyState < 4 || this.status < 200 || this.status > 299) {
					return;
				}

				data = JSON.parse(this.responseText);
				that._show(data);
			};

			xhr.open("GET", "./app/data/" + this.options.post_id + ".json");
			xhr.send(null);
		},

		_show: function(data) {
			this.render(this.options.view, data.post, this.element)
				.done(function() {
					this._loaded();
				}, this);
		}

	}
});