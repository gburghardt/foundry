    var SelectionModule = Module.extend({
        prototype: {
            actions: {
                click: [
                    "removeItem",
                    "toggleSelection"
                ]
            },

            elementStore: {
                elements: {
                    items: { selector: ".selection-list li, .selection-list tr", cacheable: false },
                    list: { selector: ".selection-list" },
                    newItemTemplate: { selector: "script.item-template" }
                }
            },

            options: {
                selectedClass: "selected"
            },

            selectedCount: 0,

            addNewItem: function(newItem) {
                if (this.notify("item.beforeAdd", {item: newItem})) {
                    this.list().appendChild(newItem);
                    this.notify("item.afterAdd", {item: newItem});
                }
            },

            createNewItem: function(data) {
                data = data || {};
                data.guid = data.guid || this.guid;

                var html = this.newItemTemplate().innerHTML.replace(/#\{([-\w.]+)\}/g, function(match, key) {
                    return data[key] || "";
                });

                var newItem = this.elementStore.parseHTML(html)[0];

                this.notify("item.created", {item: newItem, renderData: data});

                data = null;

                return newItem;
            },

            isItemSelected: function(item) {
                return new RegExp("(^|\\s+)(" + this.options.selectedClass + ")(\\s+|$)").test(item.className);
            },

            removeItem: function(event, element, params) {
                if (!this.notify("item.beforeRemove")) {
                    return;
                }

                var item = element.parentNode;
                item.parentNode.removeChild(item);

                if (this.isItemSelected(item)) {
                    this.selectedCount--;

                    this.notify("selection.size.changed", {
                        selectionSize: this.selectionSize
                    });
                }
            },

            selectedItems: function() {
                return this.elementStore.querySelectorAll("." + this.options.selectedClass, this.list());
            },

            toggleSelection: function(event, element, params) {
                if (params.preventDefault || (event.target.nodeName !== "INPUT" && event.target.nodeName !== "A")) {
                    event.preventDefault();
                }

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

                this.notify("selection.size.changed", {
                    selectionSize: this.selectionSize
                });
            }
        }
    });
