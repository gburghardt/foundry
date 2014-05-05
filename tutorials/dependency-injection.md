---
layout: default
title:  Dependency Injection With Foundry
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Learn how to leverage Dependency Injection and Inversion of Control in
    Foundry to keep your code decoupled and testable
</h2>

Foundry comes with its own Dependency Injection framework. This is a great way
to wire your modules together with their external dependencies, plus it exposes
the bowels of the framework so you can swap in your own components in favor of
the components that ship with Foundry.

## What You'll Need For This Tutorial

1. [Foundry]({{ site.baseurl }}/downloads.html),
   [module-base](https://github.com/gburghardt/module-base), and
   [module-utils](https://github.com/gburghardt/module-utils)
2. An understanding of [Dependency Injection and Inversion of Control](http://martinfowler.com/articles/injection.html)
3. Moderate knowledge of Object Oriented JavaScript

## What You'll Learn

- The basics of Dependency Injection in Foundry
- How to configure Dependency Injection to create modules

## Basics Of Dependency Injection In Foundry

<div class="aside">
    For all the details on configuring the "container" in Foundry, refer to
    the <a href="https://github.com/gburghardt/hypodermic">Hypodermic documentation</a>.
</div>

Foundry ships with its own framework for Dependency Injection (DI) and Inversion
of Control (IOC). Currently, it uses
[Hypodermic](https://github.com/gburghardt/hypodermic) as its implementation. A
"Container" object is used to configure all the dependencies in the application.
In previous tutorials, a JavaScript variable called `app` exists on all the demo
pages. You can access the container object by entering `app.container` into the
browser console.

The container is responsible for generating every other object in the framework,
including the application object itself. The `Foundry.run()` method returns an
application object. Passing a function into `Foundry.run(...)` allows you to
change the configuration for the container in Foundry. It has this basic
interface:

```javascript
var app = Foundry.run(function(dependencies, options) {
    dependencies.merge({
        // Your module definitions go here
    });
});
```

## Using Dependency Injection For Modules

If you recall the
[Events In Foundry Demo]({{ site.baseurl }}/tutorials/examples/events-in-foundry/), we had a task
list, a selection module, and a list of recently added tasks. The `data-modules`
HTML5 attributes referred to JavaScript class names. Let's build on this example
to use Dependency Injection.

First, let's configure Foundry so its container knows about our three modules:

```javascript
var app = Foundry.run(function(dependencies, options) {
   dependencies.merge({
        recentTasks: {
            type: "RecentTasksModule",
            parent: "module"
        },
        selection: {
            type: "SelectionModule",
            parent: "module"
        },
        taskList: {
           type: "TaskListModule",
           parent: "module"
       }
   });
});
```

__Note:__ Every dependency configuration for a module must inherit from the
`module` parent config, so always include `parent: "module"`.

Now, let's change the values of the `data-modules` attributes. Foundry always
attempts to create a new module using the container first, before falling back
on an exact JavaScript class name.

```html
<form data-modules="taskList" ...>
    ...
</form>

<div data-modules="recentTasks" ...>
    ...
</div>
```

That's all it takes!

Every module has a property called `options`. We can use Dependency Injection to
set common options for every module:

```javascript
var app = Foundry.run(function(dependencies, options) {
    dependencies.module.properties.options = {
        value: {
            color: "red"
        }
    };
});
```

Every module created by the container will have `this.options.color` equal to
`red`. We can make this even more flexible by declaring the `options` as its own
dependency:

```javascript
var app = Foundry.run(function(dependencies, options) {
    dependencies.merge({
        moduleOptions: {
            type: "Object",
            properties: {
                color: { value: "red" },
                screen: "screen"
            }
        }
    });

    dependencies.module.properties.options = "moduleOptions";
});
```

The first part defines a new dependency in the system called `moduleOptions`. It
is an instance of `Object`, and it will get two properties:

- color
- screen

Every instance of a module will have `this.options.color` equal to "red". Then
we see `screen: "screen"`. The Foundry container has a dependency auto created
allowing you to access the `screen` object in JavaScript. This dependency is
aptly called "screen". That means all modules will also have access to the
browser's `screen` object via `this.options.screen`.

## A Quick Recap

In this tutorial we learned how to add new dependencies to the Foundry container
and how to create module objects using Dependency Injection. This only scratches
the surface of what's available.

## Up Next: Rendering Client Side Templates

Web pages are no longer bound to HTML. Find out how to render HTML using client
side templates and a view resolver in Foundry.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/events-in-foundry-page-2.html" title="Back: A Practical Example Of Events In Foundry">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/client-side-templates.html" title="Next: Rendering Client Side Templates">Next</a></li>
</ul>
