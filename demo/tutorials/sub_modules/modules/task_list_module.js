var TaskListModule = Module.Base.extend({

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
				template: { selector: "script.item-template" }
			}
		},

		options: {
			doneClass: "done"
		},

		selection: null,

		_ready: function _ready() {
			this.selection.listen("item.beforeRemove", this, "handleItemBeforeRemove");
		},

		add: function add(event, element, params) {
			event.stop();

			var form = this.form();
			var taskTextField = form.elements.task;
			var taskText = taskTextField.value;
			var item;

			if (/^\s*$/.test(taskText)) {
				alert("Please enter the task to add.");
			}
			else {
				item = this.selection.createNewItem({ text: taskText });

				this.selection.addNewItem(item);

				this.publish("task.added", {task: taskText});
			}

			taskTextField.value = "";
			taskTextField.focus();
			taskTextField.select();

			event = element = params = item = taskTextField = null;
		},

		handleItemBeforeRemove: function handleItemBeforeRemove(event) {
			return confirm("Are you sure you want to remove this task?");
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

