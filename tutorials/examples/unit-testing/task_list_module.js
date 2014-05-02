var TaskListModule = Module.Base.extend({
	prototype: {
		add: function submit(event, element, params) {
			event.stop();

			var form = this.element,
			    input = form.querySelector("[name=taskName]"),
			    taskName = input.value,
			    item, xhr, self, data;

			if (/^\s*$/.test(taskName)) {
				this.window.alert("Please enter a task");
			}
			else {
				function onreadystatechange() {
					if (this.readyState === 4 && (this.status === 200 || this.status === 201)) {
						item.classList.remove("loading");

						self.publish("task.added", {
							task: taskName,
							item: item
						});

						cleanup();
					}
					else if (this.readyState === 4) {
						self.window.alert("Failed to save task (Error " + this.status + ")");
						cleanup();
					}
				}

				function cleanup() {
					item = xhr = xhr.onreadystatechange = self = null;
				}

				item = this.document.createElement("li"),
				item.innerHTML = "<span>" + taskName + "</span>";
				item.classList.add("loading");

				this.element
					.querySelector("ol")
					.appendChild(item);

				self = this;
				data = this.window.encodeURIComponent("task[name]=" + taskName);
				xhr = new XMLHttpRequest(),
				xhr.onreadystatechange = onreadystatechange;
				xhr.open("POST", "/tasks");
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				xhr.send(data);
			}

			input.value = "";
			input.focus();
		}
	}
});
