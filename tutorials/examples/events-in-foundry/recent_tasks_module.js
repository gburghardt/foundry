var RecentTasksModule = Module.Base.extend({
	prototype: {
		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.subscribe("task.added", this, "handleTaskAdded");
		},

		handleTaskAdded: function(publisher, data) {
			var item = this.document.createElement("li");
			item.innerHTML = data.task;
			this.element.querySelector("ol").appendChild(item);
		}
	}
});
