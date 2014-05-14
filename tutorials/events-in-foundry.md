---
layout: default
title: Events In Foundry
meta_description: Learn how to use Notification and Application events in Foundry
meta_keywords: Foundry, events, javascript, framework
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Events are central to how Foundry works. The most familiar of which are
    Document Object Model events, like <code>click</code> or
    <code>submit</code>. Application and Notification events provide the
    communication layer between modules.
</h2>

<div class="info">
    <h3>Download The Demo</h3>

    <p class="downloads">
        <a href="{{ site.baseurl }}/tutorials/examples/events-in-foundry.zip" class="download-zip"
            title="Download &ldquo;Events In Foundry&rdquo; Demo as a ZIP file"></a>
    </p>

    <p>
        View The Demo:
        <a href="{{ site.baseurl }}/tutorials/examples/events-in-foundry/">Events In Foundry</a>
    </p>
</div>

There are three kinds of events in Foundry:

- Document Object Model events
- Notification events
- Application events

Document Object Model events should be very familiar to you. These are things
like `click` and `submit`. Coupled with `data-actions` HTML5 attributes, this is
how Foundry invokes a method on a module based on user interaction. For this
tutorial we will be focusing on the last two kinds of events, Notification and
Application events.

## What You'll Need For This Tutorial

1. The [Foundry Starter Project][starter_project]
2. A basic understanding of [how Modules work in Foundry]({{ site.baseurl }}/tutorials/introduction-to-modules.html)

## What You'll Learn

This two part series dives into event handling in Foundry. This first part gives
you the gritty details, and the next part walks you through a practical example
using a task list.

In this tutorial, we learn:

- The differences between Notification and Application Events
- When to use Notification and Application Events
- How to listen for events emitted by a specific object (Notification Events)
- How to listen for events on the global event sub system (Application Events)

## Application Events

Application Events are a means for modules to communicate with one another, yet
remain decoupled. Publisher does not know who the subscribers are, or if any
exist. The Publisher can publish events without caring who is listening, or how
they react to the event. Subscribers do not know the exact module instance
publishing the event, or if anyone exists capable of publishing an event.
Furthermore, they really only care that Event X happened. They don't care if
Module A published Event X.

Think of Application Events as an intercom system. Someone picks up the phone,
says a message, and that message is broadcast all over the building. Everyone
inside the building hears the message. No one knows the exact person relaying
the message. The person making the announcement doesn't care if anyone is
listening, nor does the announcer care if no one is in the building.

Foundry gives each module a reference to the global event dispatcher. No effort
on your part is required.

### Using Application Events With Modules

When your modules inherit from `Module.Base`, three utility methods are provided
that give you access to Application Events: `publish`, `subscribe` and
`unsubscribe`.

#### Publishing Events

The `publish` method has several overloads:

1. `Boolean publish(String eventName)`: This publishes an Application Event, passing
   an empty `Object` as the event data.

    ```javascript
    this.publish("eventName");
    ```

2. `Boolean publish(String eventName, Object data)`: This publishes an Application Event
    allowing you to provide your own event data.

    ```javascript
    this.publish("eventName", { foo: "bar" });
    ```

The `publish` method returns a boolean value: `true` if the event propagated to
all of the subscribers, or `false` if one of the subscribers cancelled the
event.

#### Subscribing To Events

The `subscribe` method allows a module to subscribe to an Application Event. It
has several overloads:

1. `void subscribe(String eventName, Object context, String handlerName)`: This
    is the most common form. It provides the name of the event to which you will
    subscribe, the value of the `this` variable in the event handler, and the
    name of the method on the module to call when the event occurs.

    ```javascript
    this.subscribe("eventName", this, "handleEventName");
    ```
2. `void subscribe(String eventName, Object context, Function handler)`: This
   variation allows you to pass any `Function` object as the event handler,
   setting the value of the `this` variable inside the handler.

    ```javascript
    this.subscribe("eventName", this, this.handleEventName);

    this.subscribe("eventName", this, function(publisher, data) {
    	...
    });
    ```

3. `void subscribe(String eventName, Function handler)`: This form subscribes to
   the event, setting the `this` variable inside the handler to the `window`
   object.

    ```javascript
    this.subscribe("eventName", function(publisher, data) {
    	...
    });
    ```

#### Unsubscribing From Events

You can stop responding to events in a number of ways using the `unsubscribe`
method:

1. `void unsubscribe(String eventName, Object subscriber)`: Unsubscribe all
   handlers for this object for this event. That also means one object can
   subscribe multiple times to the same event with different handlers.

    ```javascript
    this.unsubscribe("eventName", this);
    ```

2. `void unsubscribe(String eventName, Object subscriber, String handlerName)`:
   This allows a module to unsubscribe from a specific event by the name of the
   event handler.

    ```javascript
    this.unsubscribe("eventName", this, "handleEventName");
    ```

3. `void unsubscribe(String eventName, Object subscriber, Function handler)`:
   Unsubscribes a single handler from an event, using the actual handler
   Function object.

    ```javascript
    this.unsubscribe("eventName", this, this.handleEventName);
    ```

4. `void unsubscribe(Object subscribe)`: This is the Nuclear Option of
  unsubscribing. All subscriptions for subscriber will be cancelled in a single
  line of code. This overload is useful in the `destructor` method of a module.

    ```javascript
    this.unsubscribe(this);
    ```

### Application Event Handlers

Application Event handlers must follow a few guidelines:

- Event handler methods on modules should be named for the event. For example,
  the handler for an event called `task.added` should be called
  `handleTaskAdded`
- Event handler methods receive two arguments: `publisher` and `data`.
- The `publisher` is the object that published the event
- The `data` is arbitrary data passed along in the event from the publisher.
  This will always be an object, even if the publisher did not pass any data.
- Returning false from an event handler method stops the propagation of the
  event to subsequent subscribers.

Application Events allow modules to be completely decoupled, but sometimes you
do care about who exactly is publishing an event. If Module A only wants to
respond to events from Module B, then you want Notification Events.

## Notification Events

A Notification Event is more like a telephone call between two people who know
about one another. The person initiating the call knows who they are calling.
The person being called knows who is on the other end. You can't subscribe to a
module's notifications without having a reference to that object.

In the next part, we'll see a practical example of this using a Task List. The
`TaskListModule` has a property called `selection`, which is an instance of
`SelectionModule`. The selection module is contained by the task list module.
The task list module knows exactly which selection module it is dealing with, so
Notification Events restrict communication to those two objects.

### Using Notification Events With Modules

When your modules inherit from `Module.Base`, three utility methods are provided
that give you access to Application Events: `notify`, `listen` and
`ignore`.

#### Publishing Notifications

The `notify` method is used to publish a Notification Event between two objects.
It has several overloads, like `publish` does.

1. `Boolean notify(String notificationName)`

    ```javascript
    this.notify("selection.changed");
    ```

2. `Boolean notify(String notificationName, Object data)`

    ```javascript
    this.notify("selection.changed", { size: 4 });
    ```

#### Subscribe To Notifications

The `listen` method is used to subscribe to Notification Events. This works a
little different from the `subscribe` method. You must call `listen` on the
object publishing the notifications, not the object listening for them.

```javascript
_ready: function() {
    this.selection = new SelectionModule();
    this.selection.listen("selection.changed", this, "handleSelectionChanged");
}
```

In the code example above, `this.selection` is the publisher of the
notifications.

Like `subscribe`, there are several overloads:

1. `void listen(String notificationName, Object context, String handlerName)`

    ```javascript
    this.selection.listen("selection.changed", this, "handleSelectionChanged");
    ```

2. `void listen(String notificationName, Object context, Function handler)`

    ```javascript
    this.selection.listen("selection.changed", this, this.handleSelectionChanged);
    // OR
    this.selection.listen("selection.changed", this, function(publisher, data) {
        ...
    });
    ```

3. `void listen(String notificationName, Function handler)`

    ```javascript
    this.selection.listen("selection.changed", this.handleSelectionChanged);
    // OR
    this.selection.listen("selection.changed", function(publisher, data) {
        ...
    });
    ```

### Unsubscribing From Notification Events

The `ignore` method allows you to unsubscribe from Notification Events. It has
the same overloads as `unsubscribe`, but like `listen` it must be called on the
object that publishes the notifications.

1. `void ignore(String eventName, Object subscriber)`

    ```javascript
    this.selection.ignore("eventName", this);
    ```

2. `void ignore(String eventName, Object subscriber, String handlerName)`

    ```javascript
    this.selection.ignore("eventName", this, "handleEventName");
    ```

3. `void ignore(String eventName, Object subscriber, Function handler)`

    ```javascript
    this.selection.ignore("eventName", this, this.handleEventName);
    ```

### Notification Event Handlers

Notification Event Handlers should follow the same guidlines as Application
Event Handlers.

## A Quick Recap

We've gone over the differences between Application and Notification Events,
including the module API available and when you might want to use each kind.

## Up Next: Using Events With A Task List

Next we'll create a practical example using a task list, a list of selectable
items and a module responding to any added task.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/introduction-to-modules.html" title="Back: Introduction To Modules">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/events-in-foundry-page-2.html" title="Next: A Practical Example Of Events In Foundry">Next</a></li>
</ul>

[starter_project]: {{ site.baseurl }}{% post_url 2014-05-05-foundry-starter-project %}
