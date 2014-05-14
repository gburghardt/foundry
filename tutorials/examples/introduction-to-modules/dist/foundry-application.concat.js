/*! foundry 2014-05-14 */
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
