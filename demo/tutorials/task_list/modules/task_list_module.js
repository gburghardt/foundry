var TaskListModule = Module.extend({

	prototype: {

		actions: {
			click: [
				"remove",
				"toggleComplete"
			],
			submit: [
				"add"
			]
		},

		elementStore: {
			elements: {
				form: { selector: "form" },
				itemRoot: { selector: "ol" },
				template: { selector: "script.template" }
			}
		},

		options: {
			doneClass: "done"
		},

		add: function add(event, element, params) {
			event.stop();

			var form = this.form();
			var taskTextField = form.elements.task;
			var taskText = taskTextField.value;
			var item;
			var markup;

			if (/^\s*$/.test(taskText)) {
				alert("Please enter the task to add.");
			}
			else {
				markup = this.template().innerHTML;
				item = this.elementStore.parseHTML(markup)[0];
				item.getElementsByTagName("span")[0].innerHTML = taskText;
				this.itemRoot().appendChild(item);

				this.publish("task.added", {task: taskText});
			}

			taskTextField.value = "";
			taskTextField.focus();
			taskTextField.select();

			event = element = params = item = taskTextField = null;
		},

		remove: function remove(event, element, params) {
			event.stop();
			var item;

			if (confirm("Are you sure you want to remove this task?")) {
				item = element.parentNode;
				item.parentNode.removeChild(item);
			}

			event = element = params = item = null;
		},

		toggleComplete: function toggleComplete(event, element, params) {
			event.stopPropagation();

			var regex = new RegExp("(^|\\s+)(" + this.options.doneClass + ")(\\s+|$)");
			var item = element.parentNode;

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

			event = element = item = params = null;
		}

	}

});

