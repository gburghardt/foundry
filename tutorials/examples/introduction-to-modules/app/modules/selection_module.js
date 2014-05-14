var SelectionModule = Module.Base.extend({
    prototype: {
        options: {
            selectedClass: "selected"
        },

        toggle: function click(event, element, params) {
            element.classList.toggle(this.options.selectedClass);
        }
    }
});
