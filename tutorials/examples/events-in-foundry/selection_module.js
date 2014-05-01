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
