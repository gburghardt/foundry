var RecentTasksModule = Module.extend({

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
			this.subscribe("task." + this.options.eventSuffix, this, "handleTaskEvent");
		},

		handleTaskEvent: function handleTaskEvent(event) {
			var html = this.template().innerHTML.replace(/#\{([-.\w]+)\}/g, function(match, key) {
				return event.data[key] || "";
			});

			var item = this.elementStore.parseHTML(html)[0];

			this.list().appendChild(item);

			event = item = null;
		}

	}

});
