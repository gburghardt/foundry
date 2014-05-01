---
layout: default
title: Foundry Overview
secondary_nav: overview
---

{% include tutorials/menu.html %}

# Foundry Overview

Foundry is a modern, object oriented JavaScript framework built to be
flexible, fast and easy to develop for.

This is not a sharply opinionated framework. It favors convention over
configuration, but not at the expense of commanding you how to develop
your application. Above all else, Foundry was built on these
principles:

1. Do one thing, and do it well
2. Code to an interface, not an implementation
3. Don't Repeat Yourself
4. Favor composition over inheritance
5. And there's an exception to every rule.

## Foundry Is Not MVC (But It's Not *Not* MVC)

Many server side frameworks were the first to really spread MVC as a
design pattern. The first implementations of this pattern solved
server side programming problems, which included handling stateless
connections over HTTP and TCP/IP. Web browsers use these protocols,
and it's hard to have a responsive web page without them, but handling
user interaction is not a stateless connection in a web browser. It's
a living, breathing flow from start to finish &mdash; a river that
twists and curves and changes direction unexpectedly. Simply rewriting
Ruby on Rails in JavaScript doesn't fit the bill. Browser based
applications require a unique architecture.

Foundry is broken down into the same layers as other MVC frameworks.
Controllers direct the application flow, and shouldn't contain
business logic. Views are the things users interact with. Models
contain the raw data and the reason why something happens. Lastly,
Foundry *is* the very thing that manages and organizes the application
like the conductor of an orchestra. Think of Foundry as an "MVCA"
framework.

### 'M' Is For Model

The **Model** represents raw data and business logic. Since web based
applications are networked applications, the model can exist on the
server or in the browser. Maybe when your application starts out, the
browser just POSTs data back to the server, which returns a blob of
HTML that gets plunked into an HTML tag. The model resides entirely on
the server.

As your application grows, you may need client side models. While
Foundry doesn't have a model layer built yet (one is planned), client
side models:

* Represent raw data
* Encompass business logic
* Encompass client-server communication (AJAX)
* Are usable by client side template rendering engines to generate the
  initial markup for a view

Models don't have to inherit from a certain class, or even be baked in
to the Foundry framework. If another class library has these features,
it can be used with Foundry.

### 'V' Is For DOM

The **View** in the Foundry framework, at its most basic level, is the
**Document Object Model**. The browser gives most of this to us for
free. Events are raised by the view in response to user input. The
user "clicks" on something, or "submits" a form. These are the verbs
in Foundry &mdash; the actions. There isn't always a need for a
separate class in JavaScript to represent the view, because we already
have objects: HTML tags.

Every Controller is assigned one root HTML tag. All user interaction
within that tag is handled by that Controller. Controllers should be
completely ignorant of the rest of the world. They only care about
their root element, which *is* the View managed by the Controller.

### 'C' Is For Module

**Controllers** are called **Modules** in the Foundry framework.
Modules are responsible for:

1. Responding to events raised by the View (e.g. "click", "submit",
   "mouseover", etc)
2. Publishing events when something interesting happens within the
   Module, forming integration points for other Modules
3. Subscribing to application events allowing one Module to receive
   messages from another Module without knowing the publisher exists
4. Directing user flow based on business logic
5. Only one part of the web page

The last responsibility could almost be viewed as a Module's first
responsibility: They are responsible for all actions inside one, very
focused part of the page. Modules "Do one thing, and do it well."

Modules have a more cosmopolitan lifestyle than controllers on the
server side. They don't just respond to an anonymous HTTP request,
query the database and render a view. They have a rich lifecycle that
begins on page load, and doesn't end until the user leaves the page.
*Modules maintain state.* They are truly the manefestation of what a
"Controller" encompasses in a GUI application. Each Module is tied to
a View, maintains state, responds to more than one event by the
user, and Modules interact with one another indirectly through
application events.

#### The Module Lifecycle

Modules go through five phases in their life:

1. **Instantiation** &mdash; Each Module is its own class, and must be
   instantiated before being used.
2. **Configuration** &mdash; Modules are complex beings requiring the
   help of many other classes to function. It's at this level that
   disparate class libraries coelesce to do something concerete.
   Outside dependencies are assigned in this phase.
3. **Initialization** &mdash; This phase involves the initial heavy
   lifting required to start responding to the user. It's like opening
   your doors for business before allowing customers in.
4. **Use** &mdash; At this point, Modules are responding to user
   events, and to each other. This is the asynchronous phase where the
   Module is doing what it was designed to do.
5. **Destruction** &mdash; Once a module is no longer needed, it must
   be destroyed. This means nullifying object pointers, unsubscribing
   from view and application events, and readying itself for natural
   garbage collection by the browser.

Each Module has a very specific purpose, but lacks a "global" view of
the web page.

> "Module is but pawn in game of life"

This is where Foundry comes into play as the Application.

### 'A' Is For Foundry

**Foundry** is the **application**. Each Module, View and Model
represent different sections of an orchestra. Foundry is the conductor
that ensures each piece is playing its part. The Application has a
higher calling, and an infinite reach on the web page.

An Application:

1. Is the Alpha and the Omega
2. Manages the life cycle of Modules
3. Handles exceptions thrown by various layers of the application
4. Provides a central conduit through which Modules communicate,
   called Application Events.

The Application is both the Beginning and the End. In Browser-speak,
the Application kick starts things on page load, and destroys
everything when the page unloads. The Application also manages the
Modules on the page and kick starts their life cycles. When another
object on the page encounters an error condition that it cannot
resolve, an error gets thrown. The Application handles these errors
gracefully if possible. Lastly, the Application is responsible for
constructing the communication network allowing Modules to interact
with one another.

Some general rules to follow:

* If I, a simple Module, don't know what to do, throw an exception.
* If I, a simple Module, thinks something might be of interest to
  the rest of the world, publish an Application Event
* If I, a simple Module, thinks something might be of interest to my
   immediate friends, send a Notification.
* If I, a simple Module cares about what the world is doing,
  subscribe to an Application Event.
* If I, a simple Module cares about what my immediate friends are
  doing, subscribe to a Notification.

Events are central to how Foundry works.

### Events In Foundry

Events are the most important aspect in Foundry, and also one of the
more complicated areas to grasp. There are three kinds of events:

1. **User Generated Events** &mdash; This type of event is the one
   client side developers are most familiar with: Mouse clicks, button
   presses, form submits. This is where Foundry interacts with the
   User.
2. **Application Events** &mdash; These are purely driven by
   application logic and allow Modules to communicate with one another
   so that publisher and subscriber are completely decoupled.
   Publishers don't know which, if any, subscribers exist. Subscribers
   don't know which, if any Publishers exist.
3. **Notifications** &mdash; These events are more targeted forms of
   application events. Subscriber must know that a publisher exists,
   and the Publisher knows the Subscriber exists.

To better understand events, let's dive into some role playing.

You have a busy restaurant. The Application is the restaurant owner,
making sure there are tables for everyone and ensuring service is
speedy and accurate. Each diner is a Module. Modules are seated at
tables.

One diner just discovered they got a raise at work, so they shout out
into the crowd, "I got a raise!"

The diner doesn't care who is listening, and doesn't care if *nobody*
is listening. The information is also pretty general in nature. This
is an Application Event.

At another table, three diners are eating their dinner. One of them
will become a new parent in a few months. Everyone at the table is a
friend, so the diner says, "Hey guess what. I'm gonna have a baby!"

This information is a little more personal, and isn't directed at
everyone in the world. Only the diner's friends really care about it.
The diner knows everyone at the table, and everyone at the table knows
the diner. This is a Notification Event.

## Foundry Application Structure

Foundry applications should follow a few conventions to keep them
better organized. The JavaScript file structure of a Foundry
application is as follows:

```
my_application/
  |
  +- src/
  |    |
  |    +- helpers/
  |    |
  |    +- models/
  |    |
  |    +- modules/
  |    |
  |    +- views/
  |
  +- specs/
       |
       +- helpers/
       |
       +- models/
       |
       +- modules/
       |
       +- views/
```

The "src" folder is where all your source code should go. The "specs"
folder is where all your unit tests should go. The "specs" folder
could also be called "tests".

### Foundry Helpers

Helpers are utility classes that encapsulate common functions. They
should go in the "helpers" directory with "Helper" appended to the
class name.

For example, the FormatHelper class would be saved in
`src/helpers/format_helper.js`

### Foundry Models

Any class encapsulating data should go in the "models" directory.
These classes should be named in singular form.

For example, the BlogPost model would be saved in
`src/models/blog_post.js`

### Foundry Modules

These classes should be named with "Module" appended to the end of
the class name and saved in the "modules" folder.

For example, a class called "TaskListModule" would be saved in
`src/modules/task_list_module.js`

### Foundry Views

In the vast majority of cases, you won't need views in your Foundry
application. The server side application can render the HTML fragments
that your application requires. If you choose to include a client side
template layer in your application, these templates should live in the
"views" folder.

For example, the view for a blog post would be saved in
`src/views/blog_post/details.tpl`

## Next Steps

Now that you've gotten a quick tour of Foundry, let's get our hands
dirty!

1. [Download Foundry](/downloads.html)
2. [Get started with a simple application](/tutorials/getting-started.html)
3. [View more Tutorials](/tutorials/)
4. [Browse the code](https://github.com/gburghardt/foundry)
5. [Contribute ideas](/contibuting.html),
   [bug reports](https://github.com/gburghardt/foundry/issues),
   [fixes](https://github.com/gburghardt/foundry/pulls) and
   [features](/contributing.html)
6. [View the demo](https://github.com/gburghardt/foundry/blob/master/demo/index.html)

Thanks for trying out Foundry. Happy coding!

<hr>

[[Wiki Home|Home]] |
[[Next &gt;|Dependencies]]