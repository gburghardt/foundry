var RecentTasksModule = Module.Base.extend({

	prototype: {

		elementStore: {
			elements: {
				list: { selector: "ol" },
				template: { selector: "script.template" }
			}
		},

		options: {
			eventSuffix: "added"
		},

		_ready: function _ready() {
			this.subscribe("task." + this.options.eventSuffix, this, "handleTaskAdded");
		},

		handleTaskAdded: function handleTaskAdded(publisher, data) {
			var html = this.template().innerHTML.replace(/#\{([-.\w]+)\}/g, function(match, key) {
				return data[key] || "";
			});

			var item = this.elementStore.parseHTML(html)[0];

			this.list().appendChild(item);

			publisher = data = item = null;
		}

	}

});
