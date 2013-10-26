var SelectionModule = Module.Base.extend({

	prototype: {

		elementStore: {
			elements: {
				items: { selector: "ol > li", nocache: true },
				itemRoot: { selector: "ol" },
				newItemTemplate: { selector: "script.item-template" },
				selectedItems: { selector: "ol > li.selected" }
			}
		},

		options: {
			selectedClass: "selected"
		},

		selectedCount: 0,

		addNewItem: function(newItem) {
			if (this.notify("item.add.before", {item: newItem})) {
				this.itemRoot().appendChild(newItem);
				this.notify("item.add.after", {item: newItem});
			}
		},

		createNewItem: function(data) {
			data = data || {};
			data.guid = data.guid || this.guid;

			var html = this.newItemTemplate().innerHTML.replace(/#\{([-\w.]+)\}/g, function(match, key) {
				return data[key] || "";
			});

			var newItem = this.elementStore.parseHTML(html);

			this.notify("item.created", {item: newItem, renderData: data});

			data = null;

			return newItem;
		},

		isItemSelected: function(item) {
			return new RegExp(this.options.selectedClass).test(item.className);
		},

		removeItem: function(item) {
			item.parentNode.removeChild(item);

			if (this.isItemSelected(item)) {
				this.selectedCount--;

				this.notify("selection.size.changed", {
					selectionSize: this.selectionSize
				});
			}
		},

		_toggleElementSelection: function(element) {
			var regex = new RegExp("(^|\\s+)(" + this.options.selectedClass + ")(\\s+|$)");

			if (regex.test(element.className)) {
				element.className = element.className.replace(regex, "$1$3")
				                                     .replace(/\s{2,}/g, " ");
				this.selectedCount--;
			}
			else {
				element.className = element.className + " " + this.options.selectedClass;
				this.selectedCount++;
			}

			element = null;
		},

		toggleSelection: function click(event, element, params) {
			if (params.preventDefault || (event.target.nodeName !== "INPUT" && event.target.nodeName !== "A")) {
				event.preventDefault();
			}

			this._toggleElementSelection(element);

			this.notify("selection.size.changed", {
				selectionSize: this.selectionSize
			});
		}

	}

});
