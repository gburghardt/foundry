## ElementStore

ElementStore is a utility class for managing and caching references to Document
Object Model nodes inside a root node. It has few dependencies and integrates
well with existing JavaScript libraries and frameworks.

### Why use ElementStore?

You despise:

- Repeatedly writing code that just fetches a DOM node and sets it as a property
  of an object.
- Taking a performance hit on page load because 50 CSS selectors are run on the
  page to get references to DOM nodes
- Having to write extra code to cache references to DOM nodes

You like:

- A clean, declarative syntax for defining which elements you want to use
- Using CSS selectors to get elements
- Using jQuery, or any other popular library that abstracts away the messiness
  of manipulating the Document Object Model
- Object oriented code
- Lazy loading references to DOM nodes only when you need them
- The option of eager loading DOM node references on page load
- The option to never cache certain DOM node references
- An easy solution to bake in support for all of this into existing class
  libraries

### Features of ElementStore

- Easy to use API
- DOM node references are cached and lazy loaded by default
- Decreased page load times because elements are grabbed as they are needed and
  not all at once during page load.
- Optionally eager load certain elements into the ElementStore at page load
- Optionally prevent certain elements from being cached so that they are always
  fetched from the document
- Integrates well with Inversion of Control/Dependency Injection libraries
- Get elements by selector (defaults to native querySelector and
  querySelectorAll)
- Adaptors exist for the following libraries:
  - jQuery
  - Prototype
  - Sizzle
  - Zepto
- A mixin called ElementStore.Utils is included allowing ElementStore
  to be easily "baked in" to existing JavaScript classes.
- An additional mixin called ElementStore.PropertyGetters is included that
  creates property getters for elements, allowing you to write cleaner code.

### Using ElementStore

It's easy to start using ElementStore in any project.

1. Include element_store.js:

        <!DOCTYPE HTML>
        <html>
        <head>
            ...
            <script type="text/javascript" src="path/to/element_store.js"></script>
            ...
        </head>
        <body>
            ...
        </body>
        </html>

  That's it. No other dependencies are required!

2. ElementStore needs a root element. All other elements that are "contained" in
  your ElementStore must be inside this root element.

        <body>
            <div id="my_root_element">
              <ul>
                  <li>Item #1</li>
                  <li>Item #2</li>
              </ul>

              <button>Save</button>
            </div>
        </body>

3. Instantiate ElementStore and add some configs telling ElementStore what kinds
  of elements it manages, and the CSS selectors used to get them:

        <body>
            <div id="my_root_element">
                <ul>
                    <li>Item #1</li>
                    <li>Item #2</li>
                </ul>

                <button>Save</button>
            </div>

            <script type="text/javascript">
                var store = new ElementStore();

                store.setConfig({
                    collections: {
                        items: { selector: "ul>li" }
                    },
                    elements: {
                        saveButton: { selector: "button" }
                    }
                });
            </script>
        </body>

4. Initialize ElementStore:

        <body>
            <div id="my_root_element">
                ...
            </div>

            <script type="text/javascript">
                var store = new ElementStore();

                store.setConfig({ ... });

                store.init(document.getElementById("my_root_element"));
            </script>
        </body>

5. Get a single element:

        store.getElement("saveButton"); // returns a <button>

6. Get a collection of elements:

        store.getCollection("items"); // returns a collection of <li>

7. Not sure if it is a single element or collection?

        store.get("saveButton"); // returns a <button>
        store.get("items");      // returns a collection of <li>

Only when calling getElement() or getCollection() will ElementStore fetch the
reference to that DOM node or collection. Now you can defer those processor
intensive calls to get elements by a CSS selector until you actually _need_ the
element. This can help reduce page load times.

### Integration with other JavaScript libraries

Since ElementStore uses the native querySelector and querySelectorAll functions
by default, it is not backwards compatible with older browsers. You can include
a "mixin" that bolts on support for other browsers if you use one of the
following libraries:

- jQuery
- Prototype
- Sizzle
- Zepto

*Note:* You will need to include [Inherit.js](https://github.com/gburghardt/inherit.js)
in your project.

Then all you need to do is include the mixin after ElementStore:

    <!DOCTYPE HTML>
    <html>
    <head>
        ...

        <!-- Required by the ElementStore.jQueryAdaptor mixin -->
        <script type="text/javascript" src="path/to/inherit.js/lib/function.js"></script>
        
        <!-- jQuery goodness -->
        <script type="text/javascript" src="path/to/jquery.js"></script>
        
        <!-- ElementStore class -->
        <script type="text/javascript" src="path/to/element_store.js"></script>

        <!-- ElementStore.jQueryAdaptor mixin -->
        <script type="text/javascript" src="path/to/element_store/jquery_adaptor.js"></script>

        ...
    </head>
    <body>
        ...
    </body>
    </html>

In the example above, jQuery is used to get elements by selector. Calls to
ElementStore.getCollection() and ElementStore.getElement() delegate to jQuery
and return jQuery-wrapped references to DOM nodes.

### Easy integration of ElementStore into existing class libraries

It's easy to integrate ElementStore into your other class libraries. A mixin
called ElementStore.Utils gives you methods and properties that allow you to
bake ElementStore in to any class library quickly.

*Note:* You'll need to include [Inherit.js](https://github.com/gburghardt/inherit.js)
in your project.

1. Include all the necessary files for your project:

        <!DOCTYPE HTML>
        <html>
        <head>
            ...
            <script type="text/javascript" src="path/to/inherit.js/lib/function.js"></script>
            <script type="text/javascript" src="path/to/jquery.js"></script>
            <script type="text/javascript" src="path/to/element_store.js"></script>
            <script type="text/javascript" src="path/to/element_store/jquery_adaptor.js"></script>

            <!-- ElementStore.Utils mixin -->
            <script type="text/javascript" src="path/to/element_store/utils.js"></script>

            <!-- Your class library -->
            <script type="text/javascript" src="path/to/todo_list.js"></script>
            ...
        </head>
        <body>

            <!-- The HTML used by your class library -->
            <div id="todo_list">
                <form action="#">
                    <input type="text" name="todo"> <button type="submit">Add</button>
                </form>

                Items: <span class="itemCount">0</span>
                <ol></ol>
            </div>
        </body>
        </html>

2. The contents of todo_list.js would be:

        function TodoList() {}

        TodoList.prototype = {
            constructor: TodoList,

            elementStore: {
                collections: {
                   items: { selector: "ol>li", nocache: true }
                },
                elements: {
                    todoField: { selector: "input[name=todo]", eager: true },
                    list: { selector: "ol" },
                    itemCount: { selector: ".itemCount" }
                }
            },

            init: function(element) {
                this.initElementStore(element);
            },

            addItem: function(event) {
                event.preventDefault();

                var todoText = this.todoField().val();

                this.list().append('<li>' + todoText + '</li>');
                this.itemCount().html(this.items().length);
            }
        };

        // Include the Element.Utils mixin
        TodoList.include(Element.Utils);

3. Instantiate and use your class:

        <body>
            <div id="todo_list">
                <form action="#">
                    <input type="text" name="todo"> <button type="submit">Add</button>
                </form>

                Items: <span class="itemCount">0</span>
                <ol></ol>
            </div>

            <script type="text/javascript">
                var todoList = new TodoList();

                todoList.init(document.getElementById("todo_list"));

                $("#todo_list").submit(function(event) {
                  todoList.addItem(event);
                });
            </script>
        </body>

#### Working with inheritance

The `elementStore` property of a function prototype serves as the config passed
into an instance of ElementStore. You can create a hierarchy in your class
libraries, and the ElementStore.Utils mixin can merge all of the `elementStore`
configs in the parent classes.

1. First, the "parent" class:

        function Parent() {}

        Parent.prototype = {
            constructor: Parent,

            elementStore: {
                elements: {
                    form: { selector: "form" }
                }
            },

            init: function(element) {
                this.initElementStore(element);
            }
        };

        Parent.include(ElementStore.Utils);

2. Now the "child" class:

        function Child() {}

        // "inherit" from the Parent class
        Child.prototype = new Parent();

        // More ElementStore configs
        Child.prototype.elementStore = {
            collections: {
                items: { selector: "li" }
            },
            elements: {
                button: { selector: "button" }
            }
        };

Instances of `Parent` will have the following method:

- form() -> Returns a `<form>` tag

Instances of `Child` will have these methods:

- form() -> Returns a `<form>` tag (inherited from Parent!)
- items() -> Returns a collection of `<li>` tags
- button() -> Returns a `<button>` tag

### Using the "property getters" feature

The "property getters" feature allows you to create properties on objects and
have them execute a custom function. This can only be used with newer browsers.
Under the hood, we use [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
to support this behavior.

Lets change the previous example to include the ElementStore.PropertyGetters
mixin as well, which provides this functionality.

1. Include the source code for ElementStore.PropertyGetters:

        <!DOCTYPE HTML>
        <html>
        <head>
            ...
            <script type="text/javascript" src="path/to/inherit.js/lib/function.js"></script>
            <script type="text/javascript" src="path/to/jquery.js"></script>
            <script type="text/javascript" src="path/to/element_store.js"></script>
            <script type="text/javascript" src="path/to/element_store/jquery_adaptor.js"></script>
            <script type="text/javascript" src="path/to/element_store/utils.js"></script>

            <!-- ElementStore.PropertyGetters mixin -->
            <script type="text/javascript" src="path/to/element_store/property_getters.js"></script>

            <!-- Your class library -->
            <script type="text/javascript" src="path/to/todo_list.js"></script>
            ...
        </head>
        <body>
            ...
        </body>
        </html>

2. Refactor todo_list.js:

        function TodoList() {}

        TodoList.prototype = {
          ...

            addItem: function(event) {
                event.preventDefault();

                var todoText = this.todoField.val();

                this.list.append('<li>' + todoText + '</li>');
                this.itemCount.html(this.items.length);
            }
        };

The ElementStore.PropertyGetters mixin removes all those pesky parenthesis from
the auto generated methods to get elements and collections!

So `this.list()` becomes simply `this.list`

And `this.items().length` becomes just `this.items.length`

You still get all of the lazy loading, caching goodness of ElementStore with
less clutter.
