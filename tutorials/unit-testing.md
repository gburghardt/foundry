---
layout: default
title: Unit Testing Foundry Applications
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Modules can be written so they are completely encapsulated. The
    <code>window</code> and <code>document</code> objects are public properties,
    making them easy to mock and spy on with Jasmine, or other testing
    frameworks.
</h2>

Modules are most likely what you'll need to test the most in a Foundry
application. In our sample application, we have a task list module, and another
module called recent tasks. The Document Object Model is a pain point with unit
testing, but due to modules in Foundry being completely encapsulated components,
mocking objects like the `document` and the `window` become much easier.

## What You'll Need For This Tutorial

1. [Foundry][0]
2. A copy of [Mocking Bird][1] to mock AJAX requests
3. [Jasmine][2] for unit testing

## Unit Testing A Module

For our example, we will be working with a simple task list module. It will:

- Take the name of a task
- Send a POST request to the server to create the task
- Publish an event called `task.added`
- Add the new task to a list on screen

<h3 class="code-label">task_list_module.js</h3>

```javascript
var TaskListModule = Module.Base.extend({
    prototype: {
        add: function submit(event, element, params) {
            event.stop();

            var form = this.element,
                input = form.elements.taskName,
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
```

As you can see, this is pretty involved. We are dealing with the Document Object
Model, and AJAX, plus the `add` operation is an asynchronous method call. We'll
need a little help in the form of [Mocking Bird][1], which allows you to mock
AJAX calls in a synchronous fashion.

When running your Jasmine tests, you'll need the following JavaScript files:

1. `mocking_bird.js`
2. `mocking_bird/xml_http_request.js`
3. `foundry.concat.js`
4. `task_list_module.js`

### The TaskListModule Spec

The spec for TaskListModule will need a few things to start with:

<h3 class="code-label">task_list_module_spec.js</h3>

```javascript
describe("TaskListModule", function() {

    var module,
        element,
        event,
        params,
        win,
        doc;

    function FauxEvent(type, target) {
        this.type = type;
        this.target = target;
    }
    FauxEvent.prototype = {
        type: null,
        target: null,
        constructor: FauxEvent,
        preventDefault: function() {},
        stopPropagation: function() {},
        stop: function() {} // required by the front controller
    };

    beforeEach(function() {
        element = document.createElement("div");
        module = new TaskListModule();
    });

    describe("add", function() {
        ...
    });

});
```

Because all module actions, like `TaskListModule#add` are public methods, we can
mock the browser `event`, `element` and `params` arguments. The specs for the
`add` method require a little more setup. In order to this correctly, let's
explore the module API a little bit.

Every module has these public properties:

- `element`: The root element for this module
- `document`: The document object to which the root element belongs
- `window`: The window object to which the document belongs

Modules do not need to reference global functions, or the global `document`
object. They have everything they need via `this.window` for global functions,
and `this.document` for any document related functions. This allows you to fully
encapsulate your module and make it testable. We can mock these crucial objects
in the setup and teardown for each spec. Additionally, we are using MockingBird
to mock AJAX requests, so before each spec we call
`MockingBird.XMLHttpRequest.disableNetworkConnections()`, and then after each
spec we re-enable them using
`MockingBird.XMLHttpRequest.enableNetworkConnections()`.

```javascript
describe("add", function() {

    beforeEach(function() {
        MockingBird.XMLHttpRequest.disableNetworkConnections();

        doc = {
            createElement: function() {}
        };
        win = {
            encodeURIComponent: function(x) {
                return encodeURIComponent(x);
            },
            alert: function() {}
        };
        module.init(element);
        module.document = doc;
        module.window = win;
        event = new FauxEvent("submit", element);
        params = {};
    });

    afterEach(function() {
        MockingBird.XMLHttpRequest.enableNetworkConnections();
    });

    ...
});
```

Let's look at our first spec for `TaskListModule#add`:

```javascript
describe("add", function() {
    ...

    it("tells the user to enter a valid task name", function() {
        spyOn(win, "alert");
        element.innerHTML = '<input type="text" name="taskName">';

        module.add(event, element, params);

        expect(win.alert).toHaveBeenCalled();
    });
```

This test asserts that entering nothing into the text field causes a browser
alert to pop up notifying the user of their error. Since we are mocking the
`window` object in the `module`, we can use a Jasmine Spy to ensure it got
called properly.

The next spec asserts that a task gets added to the page:

```javascript
describe("add", function() {
    ...

    it("adds a task", function() {
        var ol = document.createElement("ol"),
            li = document.createElement("li");

        MockingBird.XMLHttpRequest.mock("/tasks", "POST", {
            status: 201,
            body: "created"
        });

        spyOn(element, "querySelector").and.returnValue(ol);
        spyOn(doc, "createElement").and.returnValue(li);

        module.add(event, element, params);

        expect(ol.firstChild).toBe(li);
    });
```

This is where MockingBird comes into play. Looking at the source code for our
`add` method, the AJAX request is a `POST` sent to `/tasks`. We use
`MockingBird.XMLHttpRequest.mock(...)` to mock that request. We also spy on a
few DOM related methods so they return an `<ol>` and `<li>` object, which we
then make assertions on.

To kick off the test, we simply call `module.add(event, element, params)`,
passing in the mocked up objects for each argument. It's not enough to test the
"happy path" through our application. What if the server errors out when the
AJAX request is sent? How does our module behave? Time for the next spec:

```javascript
describe("add", function() {
    ...

    it("tells the user when something went wrong", function() {
        MockingBird.XMLHttpRequest.mock("/tasks", "POST", {
            status: 500,
            body: "Server Error"
        });

        element.innerHTML = [
            '<input type="text" name="taskName" value="Take out the garbage">',
            '<ol></ol>'
        ].join("");

        spyOn(win, "alert");
        spyOn(doc, "createElement").and.returnValue(document.createElement("li"));

        module.add(event, element, params);

        expect(win.alert).toHaveBeenCalledWith("Failed to save task (Error 500)");
    });
```
We still mock an AJAX request, but the HTTP status code now is `500`, which
should trigger an alert box to pop up. We spy on our mock window object's alert
method, and then assert that it was called with an error message.

Let's see all the tests, including the setup and teardown all in one block:

<h3 class="code-label">The Full TaskListModule Spec</h3>

```javascript
describe("TaskListModule", function() {

    var module,
        element,
        event,
        params,
        win,
        doc;

    function FauxEvent(type, target) {
        this.type = type;
        this.target = target;
    }
    FauxEvent.prototype = {
        type: null,
        target: null,
        constructor: FauxEvent,
        preventDefault: function() {},
        stopPropagation: function() {},
        stop: function() {} // required by the front controller
    };

    beforeEach(function() {
        element = document.createElement("div");
        module = new TaskListModule();
    });

    describe("add", function() {

        beforeEach(function() {
            MockingBird.XMLHttpRequest.disableNetworkConnections();

            doc = {
                createElement: function() {}
            };
            win = {
                encodeURIComponent: function(x) {
                    return encodeURIComponent(x);
                },
                alert: function() {}
            };
            module.init(element);
            module.document = doc;
            module.window = win;
            event = new FauxEvent("submit", element);
            params = {};
        });

        afterEach(function() {
            MockingBird.XMLHttpRequest.enableNetworkConnections();
        });

        it("tells the user to enter a valid task name", function() {
            spyOn(win, "alert");
            element.innerHTML = '<input type="text" name="taskName">';

            module.add(event, element, params);

            expect(win.alert).toHaveBeenCalled();
        });

        it("adds a task", function() {
            var ol = document.createElement("ol"),
                li = document.createElement("li");

            MockingBird.XMLHttpRequest.mock("/tasks", "POST", {
                status: 201,
                body: "created"
            });

            spyOn(element, "querySelector").and.returnValue(ol);
            spyOn(doc, "createElement").and.returnValue(li);

            module.add(event, element, params);

            expect(ol.firstChild).toBe(li);
        });

        it("tells the user when something went wrong", function() {
            MockingBird.XMLHttpRequest.mock("/tasks", "POST", {
                status: 500,
                body: "Server Error"
            });

            element.innerHTML = [
                '<input type="text" name="taskName" value="Take out the garbage">',
                '<ol></ol>'
            ].join("");

            spyOn(win, "alert");
            spyOn(doc, "createElement").and.returnValue(document.createElement("li"));

            module.add(event, element, params);

            expect(win.alert).toHaveBeenCalledWith("Failed to save task (Error 500)");
        });

    });

});
```

## A Quick Recap

With a little assitance from [Mocking Bird][1], we can unit test AJAX in a
synchronous fashion and mock all the HTTP requests. We can inject mock objects
for the `window` and `document` public properties on our modules, and make
assertions that methods are getting called on these normally global variables.
The source code for modules should never reference global variables. If you need
to call a global function, use `this.window.foo`, and if you need to call a
document related function, use `this.document.foo` so your module is properly
encapsulated and testable.

## Up Next: Lazy Loading Modules

The more modules you have on your page, the more work the browser does on page
load. Learn how you can delay the creation of modules until they are scrolled
into view in the next tutorial.

<ul class="pagination">
    <li class="pagination-back"><a href="/tutorials/client-side-templates.html" title="Back: Rendering Client Side Templates">Back</a></li>
    <li class="pagination-up"><a href="/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="/tutorials/lazy-loading-modules.html" title="Next: Lazy Loading Modules">Next</a></li>
</ul>

[0]: /downloads.html
[1]: https://github.com/gburghardt/mocking_bird/
[2]: http://jasmine.github.io
