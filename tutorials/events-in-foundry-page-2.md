---
layout: default
title: A Practical Example Of Events In Foundry
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    In the <a href="{{ site.baseurl }}/tutorials/events-in-foundry.html">previous tutorial</a>,
    we outlined two kinds of events that modules deal with. In this tutorial,
    we dive into a real world implementation of Application and Notification
    events in Foundry.
</h2>

<div class="info">
    <p>
        You can view the demo here:
        <a href="{{ site.baseurl }}/tutorials/examples/events-in-foundry/">Events In Foundry</a>
    </p>
</div>

## What You'll Need For This Tutorial

1. [Foundry]({{ site.baseurl }}/downloads.html),
   [module-base](https://github.com/gburghardt/module-base), and
   [module-utils](https://github.com/gburghardt/module-utils)
2. A basic understanding of [how Modules work in Foundry]({{ site.baseurl }}/tutorials/introduction-to-modules.html)
3. A basic understanding of [events in Foundry]({{ site.baseurl }}/tutorials/events-in-foundry.html)

## What You'll Learn

- How to subscribe to and publish Notification Events
- How to subscribe to and publish Application Events

## Overview

We will create three modules, each with their own responsibilities:

- `TaskListModule`
  - Adds tasks to a list
  - Publishes an Application Event when a task is added
  - Has a `SelectionModule`, and listens for a Notification Event
- `SelectionModule`
  - Selects and deselects items in a list
  - Publishes a Notification Event when the selection size has changed
- `RecentTasksModule`
  - Shows a list of recently added tasks

First, let's look into wiring up Application Events.

## Using Application Events

The `TaskListModule` publishes an Application Event when a task is added. The
`RecentTasksModule` subscribes to this event, and adds the newly created task to
its own list. First, let's tackle the easy part: subscribing to the event.

<h3 class="code-label">Contents of recent_tasks_module.js</h3>

```javascript
var RecentTasksModule = Module.Base.extend({
    prototype: {
        _ready: function() {
            Module.Base.prototype._ready.call(this);

            this.subscribe("task.added", this, "handleTaskAdded");
        },

        handleTaskAdded: function(publisher, data) {
            var item = this.document.createElement("li");
            item.innerHTML = data.task;
            this.element.querySelector("ol").appendChild(item);
        }
    }
});
```

In the `_ready` method, we subscribe to the `task.added` event, which will
invoke `handleTaskAdded`. In the event handler, we get the following arguments:

1. `publisher`: Any instance of `TaskListModule`.
2. `data`: Arbitrary data passed along in the event. In this case, it will take
   the form of:

    ```javascript
    {
        "task": "task name",
        "item": [object HTMLLIElement]
    }
    ```

Now that we have a subscriber to the `task.added` event, let's look at how we'll
publish this event in `TaskListModule`.

<h3 class="code-label">Contents of task_list_module.js</h3>

```javascript
var TaskListModule = Module.Base.extend({

    prototype: {

        add: function submit(event, element, params) {
            event.stop();

            var form = this.element,
                input = form.elements.taskName,
                taskName = input.value;

            if (/^\s*$/.test(taskName)) {
                alert("Please enter a task");
            }
            else {
                var item = this.document.createElement("li");
                item.innerHTML = taskName;

                this.element.querySelector("ol").appendChild(item);

                this.publish("task.added", {
                    task: taskName,
                    item: item
                });
            }

            input.value = "";
            input.focus();
        }

    }

});

```

We have one Module Action called `add`, which is triggered by a `submit` event.
All we do is add a new `<li>` tag to a list containing the text of the new task.
The call to `this.publish(...)` is where `TaskListModule` and
`RecentTasksModule` get wired together.

Let's look at the HTML necessary for both of these modules to exist:

```html
<form method="GET" action="#"
    data-modules="TaskListModule"
    data-module-options='{
        "controllerId": "tasks",
        "defaultModule": true
    }'
    data-actions="tasks.add"
>
    <h2>Tasks</h2>
    <p>
        <label>Task: <input type="text" name="taskName"></label>
        <button type="submit">Add Task</button>
    </p>

    <ol></ol>
</form>

<div data-modules="RecentTasksModule">
    <h2>Recently Added Tasks</h2>
    <ol></ol>
</div>
```

We have a `<form>` tag with `data-modules="TaskListModule"` which is the root
element of the `TaskListModule`. Below that is a `<div>` tag with
`data-modules="RecentTasksModule"`. Foundry creates those modules for you, so
no additional code is necessary.

Application Events are the easiest to deal with. Notification Events require a
little more knowledge about a module's surrounding environment.

## Using Notification Events

In this section, we will create a `SelectionModule`, which will handle the
selecting and deselecting of items in a list. The `TaskListModule` will hold a
reference to an instance of `SelectionModule`, and listen for notification
events on it. First, let's see the source code for `SelectionModule`:

<h3 class="code-label">Contents of selection_module.js</h3>

```javascript
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
```

Our `SelectionModule` has three main responsibilities:

1. Add a new item to the list
2. Return the number of selected items
3. Toggle the selection on a single item

The `toggle` method is the sole Module Action, responding to a `click` event. In
this method we call `this.notify(...)`, which sends the Notification Event. Now
we will change `TaskListModule` so it has a reference to a `SelectionModule`.

<h3 class="code-label">Changes to task_list_module.js</h3>

```javascript
var TaskListModule = Module.Base.extend({

    prototype: {

        selection: null,

        _ready: function() {
            Module.Base.prototype._ready.call(this);

            this.selection.listen("item.selectionSizeChanged", this, "handleItemSelectionSizeChanged");
        },

        destructor: function() {
            if (this.selection) {
                this.selection.ignore("item.selectionSizeChanged", this);
                this.selection.destructor();
                this.selection = null;
            }
        },

        onControllerRegistered: function(frontController, controllerId) {
            frontController.registerController(this.selection);
        },

        onControllerUnregistered: function(frontController) {
            frontController.unregisterController(this.selection);
        },

        handleItemSelectionSizeChanged: function(publisher, data) {
            this.element.querySelector(".selection-count").innerHTML =
                this.selection.getSelectedCount();
        },

        add: function submit(event, element, params) {
            ...

            if (/^\s*$/.test(taskName)) {
                ...
            }
            else {
                var item = this.document.createElement("li");
                item.innerHTML = taskName;

                this.selection.addItem(item);

                ...
            }

            ...
        }

    }

});
```

There is one small change to the `add(...)` method that is worth noting. When we
add a new item to the list, we call `this.selection.addItem(...)` &mdash; the
`SelectionModule` is responsible for actually attaching the new task item to the
document.

<div class="aside">
    The <code>selection</code> property will be created by Foundry, and an
    instance of <code>SelectionModule</code> will be injected for us. Later
    on in this tutorial, we'll see how the <code>data-module-property</code>
    HTML5 attribute allows Foundry to do this. For now, just know that
    Foundry will give <code>TaskListModule</code> a new instance of
    <code>SelectionModule</code> with no additional work on our end.
</div>

The `_ready` method calls `listen(...)` on the `selection` property. Our
`TaskListModule` is listening for the same notification that `SelectionModule`
sends in the `toggle` method.

The `destructor` method is invoked by Foundry when a module is no longer needed,
which is where we stop listening for notifications on the `SelectionModule` and
destroy it.

The `onControllerRegistered` and `onControllerUnregistered` methods are required
by Foundry in order to register the `SelectionModule` for DOM events.

Lastly, `handleItemSelectionSizeChanged` is the event handler for the
Notification Event sent by the `SelectionModule`. It has the usual `publisher`
and `data` arguments, except this time we know that `publisher` and
`this.selection` are the same object. In this event handler, the
`TaskListModule` just updates a visible count of the number of selected items.

Let's look at how the HTML structure for the `TaskListModule` has changed to
support the `SelectionModule`:

```html
<form method="GET" action="#"
    data-modules="TaskListModule"
    data-module-options='{
        "controllerId": "tasks",
        "defaultModule": true
    }'
    data-actions="tasks.add"
>
    <h2>Tasks</h2>
    <p>
        <label>Task: <input type="text" name="taskName"></label>
        <button type="submit">Add Task</button>
    </p>

    <div data-module-property="selection"
        data-modules="SelectionModule"
        data-module-options='{"controllerId": "tasks-selection"}'>
        <ol></ol>

        <p>
            Selected: <span class="selection-count">0</span>
        </p>
    </div>

</form>
```

The main difference is the addition of a new `<div>` tag:

```html
<div data-module-property="selection"
    data-modules="SelectionModule"
    data-module-options='{"controllerId": "tasks-selection"}'>
    ...
</div>
```

This is where Foundry does a little heavy lifting for us. When creating the
`TaskListModule`, Foundry looks for any element inside the root element for
`TaskListModule` that has an HTML5 attribute called `data-module-property`. This
causes Foundry to create a new `SelectionModule` and inject it into the new
instance of `TaskListModule` as the `selection` property.

This gives you the basic idea of how to use Notification Events. A module holds
a reference to another module, and calls `listen(...)` on it. The other module
calls `notify(...)` to send the Notification Event.

__Demo:__ [Events In Foundry]({{ site.baseurl }}/tutorials/examples/events-in-foundry/)

## A Quick Recap

We learned how two modules that do not have knowledge about one another can
communicate via Application Events. The `TaskListModule` publishes an
Application Event called `task.added`. The `RecentTasksModule` subscribes to the
`task.added` event and adds the new task to its own list.

We also found out how two modules can communicate directly with one another via
Notification Events. The `TaskListModule` holds a reference to `SelectionModule`
using the `this.selection` property. In the `_ready` method, `TaskListModule`
calls `this.selection.listen(...)`. Then in `SelectionModule`, the `toggle`
method calls `this.notify(...)` to send the Notification Event, causing
`TaskListModule` to respond.

## Up Next: Dependency Injection With Foundry

So far we've been hard coding JavaScript class names in the `data-modules`
HTML5 attributes. Behind the scenes, Foundry is using Dependency Injection to
wire together the framework. Learn how to leverage Dependency Injection and
Inversion of Control when creating your own modules.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/events-in-foundry.html" title="Back: Events In Foundry">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/dependency-injection.html" title="Next: Using Dependency Injection With Foundry">Next</a></li>
</ul>
