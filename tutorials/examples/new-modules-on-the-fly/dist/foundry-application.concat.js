/*! foundry 2014-05-14 */
var TaskListModule = Module.Base.extend({
	prototype: {

		options: {
			confirmDeleteMessage: "Are you sure you want to delete this list?",
			confirmRemoveSelected: "Are you sure you want to remove the selected items",
			selectedClass: "selected",
			type: null
		},

		_ready: function() {
			Module.Base.prototype._ready.call(this);
			this.element.classList.add("taskList-" + this.options.type);
		},

		add: function submit(event, element, params) {
			event.preventDefault();

			var form = element,
			    input = form.elements.task,
			    task = input.value,
			    item;

			if (/^\s*$/.test(task)) {
				this.window.alert("Please enter a task");
			}
			else {
				item = this.document.createElement("li");
				item.setAttribute("data-actions", this.controllerId + ".toggle");
				item.innerHTML = task.charAt(0).toUpperCase() + task.substring(1);
				this.element.querySelector("ol").appendChild(item);
			}

			input.value = "";
			input.focus();
		},

		destroy: function click(event, element, params) {
			event.stop();

			if (this.getItemCount() === 0 || this.window.confirm(this.options.confirmDeleteMessage)) {
				this.destructor();
			}
		},

		getItemCount: function() {
			return this.element.querySelectorAll("ol>li").length;
		},

		removeSelected: function click(event, element, params) {
			event.preventDefault();

			var items = this.element.querySelectorAll("ol>li." + this.options.selectedClass),
			    i = 0,
			    length = items ? items.length : 0,
			    item;

			if (length > 0 && this.window.confirm(this.options.confirmRemoveSelected)) {
				for (i; i < length; i++) {
					item = items[i];
					item.parentNode.removeChild(item);
				}
			}
		},

		toggle: function click(event, element, params) {
			element.classList.toggle(this.options.selectedClass);
		}

	}
});
