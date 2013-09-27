var TaskListModule = Module.extend({

	prototype: {

		actions: {
			click: [
				"remove",
				"removeDone",
				"toggleDone"
			],
			submit: [
				"add"
			]
		},

		elementStore: {
			collections: {
				finishedTasks: { selector: "ol>li.done", nocache: true }
			},
			elements: {
				form: { selector: "form" }
			}
		},

		options: {
			doneClass: "done"
		},

		selection: null,

		add: function add(event, element, params) {
			event.stop();
			var taskTextField = this.form().elements.task_text;
			var taskText = taskTextField.value;
			var item;
			var that = this;

			if (/^\s*$/.test(taskText)) {
				alert("Please enter the task to add.");
				taskTextField.focus();
				taskTextField.select();
			}
			else {
				this._loading();

				this._delay(function() {
					item = this.selection.createNewItem({text: taskText})[0];
					this.selection.addNewItem(item);
					taskTextField.value = "";
					this._loaded();
					taskTextField.focus();
					taskTextField.select();
					this.publish("task.added", {task: taskText});
					event = element = params = item = taskTextField = null;
				}, this);
			}
		},

		_delay: function _delay(callback, context) {
			var millis = Math.floor(Math.random() * 1000);

			if (millis > 3000) {
				millis = 3000;
			}

			setTimeout(function() {
				callback.call(context);
			}, millis);
		},

		remove: function remove(event, element, params) {
			event.stop();

			if (confirm("Are you sure you want to remove this task?")) {
				this._loading(element.parentNode);
				this._delay(function() {
					this.selection.removeItem(element.parentNode);
					event = element = params = null;
				}, this);
			}

		},

		removeDone: function removeDone(event, element, params) {
			event.stop();

			if (confirm("Remove all finished tasks?")) {
				var items = this.finishedTasks();

				for (var i = 0, length = items.length; i < length; i++) {
					this._loading(items[i]);
				}

				this._delay(function() {
					for (var i = 0, length = items.length; i < length; i++) {
						this.selection.removeItem(items[i]);
					}
				}, this);
			}
		},

		toggleDone: function toggleDone(event, element, params) {
			event.stopPropagation();
			var regex = new RegExp("(^|\\s+)(" + this.options.doneClass + ")(\\s+|$)");
			var item = element.parentNode;

			this._loading(item);
			this._delay(function() {
				if (!element.checked) {
					item.className = item.className.replace(regex, "$1$3")
					                               .replace(/[\s]{2,}/g, " ");
				}
				else {
					item.className = item.className + " " + this.options.doneClass;

					this.publish("task.completed", {
						task: item.getElementsByTagName("span")[0].innerHTML
					});
				}

				this._loaded(item);

				event = element = item = params = null;
			}, this);
		}

	}

});
