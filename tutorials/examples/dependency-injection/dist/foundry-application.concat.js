/*! foundry 2014-05-14 */
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
var SelectionModule = Module.Base.extend({
	prototype: {
		options: {
			selectedClass: "selected"
		},

		addItem: function(item) {
			item.setAttribute("data-actions", this.controllerId + ".toggle");
			this.element.querySelector("ol").appendChild(item);
		},

		getSelectedCount: function() {
			return this.element.querySelectorAll("ol>li." + this.options.selectedClass).length;
		},

		toggle: function click(event, element, params) {
			element.classList.toggle(this.options.selectedClass);
			this.notify("item.selectionSizeChanged");
		}
	}
});

var TaskListModule = Module.Base.extend({

	prototype: {

		selection: null,

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.selection.listen("item.selectionSizeChanged", this, "handleItemSelectionSizeChanged");
		},

		destructor: function() {
			if (this.selection) {
				this.selection.ignore("item.selectionSizeChanged", this);
				this.selection.destructor();
				this.selection = null;
			}
		},

		handleItemSelectionSizeChanged: function(publisher, data) {
			this.element.querySelector(".selection-count").innerHTML =
				this.selection.getSelectedCount();
		},

		add: function submit(event, element, params) {
			event.stop();

			var form = this.element,
				input = form.elements.taskName,
				taskName = input.value;

			if (/^\s*$/.test(taskName)) {
				alert("Please enter a task");
			}
			else {
				var item = this.document.createElement("li");
				item.innerHTML = taskName;

				this.selection.addItem(item);

				this.publish("task.added", {
					task: taskName,
					item: item
				});
			}

			input.value = "";
			input.focus();
		}

	}

});