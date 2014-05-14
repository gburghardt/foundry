---
layout: default
title: Introduction To Modules In Foundry
secondary_nav: modules-intro
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Learn how to create a module that reacts to the user
</h2>

<div class="info">
    <h3>Download The Demo</h3>

    <p class="downloads">
        <a href="{{ site.baseurl }}/tutorials/examples/introduction-to-modules.zip" class="download-zip"
            title="Download &ldquo;Introduction To Modules&rdquo; Demo as a ZIP file"></a>
    </p>

    <p>
        View The Demo:
        <a href="{{ site.baseurl }}/tutorials/examples/introduction-to-modules/">Introduction To Modules</a>
    </p>
</div>

## What You'll Need For This Tutorial

1. A basic understanding of [how Foundry works]({{ site.baseurl }}/overview.html)
2. The [Foundry Starter Project][starter_project]
3. Working knowledge of HTML
4. Moderate knowledge of JavaScript, the Document Object Model and
   object oriented programming
5. A basic understanding of the [MVC design pattern](http://martinfowler.com/eaaDev/uiArchs.html#ModelViewController).

## What You'll Learn

- How to build a Module
- How to map DOM events to methods on your module
- How to use `this.options` as runtime configurable settings to configure two
  instances of the same class differently.

## What Is A Module?

Modules in Foundry occupy the Controller layer of an MVC application. They
handle the user interaction for a given root element on the page. They also
publish and subscribe to events and notifications, which we will dig into in the
next tutorial. For now, let's create a simple module to learn the basics.

A method in a module's class that processes a DOM event is called an __action__
in Foundry.

## Creating a Selection Module

We are going to create a module that selects and deselects items in a list. It
will respond to `click` events, and it will have one runtime configurable option
to toggle the background color of the selected items.

Below is the source code for `app/modules/selection_module.js`

<h3 class="code-label">app/modules/selection_module.js</h3>

```javascript
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
```

There are several key pieces to note:

1. `SelectionModule` inherits from `Module.Base`. This is the base class for all
   modules in Foundry. In a later tutorial, we'll show you how to bend this
   rule.
2. The `options` property defines one runtime configurable setting called
   `selectedClass`.
3. The `toggle` method, which is a named function: `toggle: function click(...)`

By default, Foundry wires up `click` and `submit` event handlers for each module
without you having to do anything. Your module source code maps the name of a
method to a DOM event by the `name` you give the function.

Consider this:

```javascript
function foo() {}

alert(foo.name)
```

Functions declared as `function xyz() {}` are treated in a special way. Every
function in JavaScript is an object, and the `name` property of functions
declared in this manor is the name of the object. The code above will show
"foo" when running `alert(foo.name)`. This is an important feature to note
because this is how Foundry maps methods to DOM events. Let's look into the
`toggle` method a little deeper.

```javascript
toggle: function click(event, element, params) {
    ...
}
```

First, you'll notice `toggle: function click`. The Function object for this
method will have a name property equal to "click". This tells Foundry to invoke
this method only during a `click` event. Try running this code in your browser:

```javascript
alert(SelectionModule.prototype.toggle.name)
```

It should alert "click".

The `toggle` function also takes three arguments: `event`, `element` and
`params`:

- `event`: The browser event object
- `element`: The HTML tag that has the `data-actions` attribute on it.
- `params`: Data passed along in this one module action.

### Rebuilding the JavaScript Package

First, add `selection_module.js` to `config/files.json`

```javascript
{
    ...
    "application": [
        "app/modules/selection_module.js"
    ]
}
```

Lastly, run `grunt` from the command line in the Foundry Starter Project
directory.

In the next section, we'll explore the glue between HTML and JavaScript.

### The Selection Module HTML

The jump from a `click` event to executing a JavaScript function is done through
the use of special HTML5 data attributes. Let's look at the HTML required for
our `SelectionModule`:

```html
<div data-modules="SelectionModule" data-module-options='{"controllerId": "fruitSelection"}'>
    <ol>
        <li data-actions="fruitSelection.toggle">Apples</li>
        <li data-actions="fruitSelection.toggle">Oranges</li>
        <li data-actions="fruitSelection.toggle">Grapes</li>
    </ol>
</div>
```

We have a `<div>` tag that wraps the whole module. The
`data-modules="SelectionModule"` attribute tells Foundry to create a new
instance of SelectionModule, using the `<div>` tag as its root element. The
`data-module-options` attribute provides some overrides to the `options`
property on the SelectionModule. Here we set the `controllerId` option, which is
how we'll tell Foundry which actions are associated with this particular
instance of SelectionModule.

Notice that the `<li>` tags each have an attribute called `data-actions`. This
is the bridge between a DOM event and your Module's code. This attribute
contains a space separated list of module actions that can be invoked by the
user in response to normal DOM events. Here we see `fruitSelection.toggle`.
Foundry identifies this instance of SelectionModule as `fruitSelection`, which
is set from the `controllerId` property in the `data-module-options`. The method
that Foundry will call on our SelectionModule is `toggle`.

```
<div ... data-module-options='{"controllerId": "fruitSelection">'
    <ol>
        <li data-actions="fruitSelection.toggle">...</li>
                          |____________| |____|
                                |          |
        Controller Id: ---------+          |
                                           |
          Method Name: --------------------+
```

In the previous section we said the `toggle` method gets three arguments. The
`element` will be the HTML tag with the `data-actions` attribute on it:

```html
<li data-actions="fruitSelection.toggle">
```

The `params` object passed into `SelectionManager.toggle` will be an empty
object in our case. In a later tutorial we'll learn how to use the
`data-action-params` attribute to pass arbitrary data to the action methods in
our modules.

### Using our SelectionModule Class

Now, add HTML to our web page that puts all the pieces together, including some
simple CSS styles to highlight the selected items:

```html
<head>
    ...

    <style type="text/css">
        .selected {
            background-color: #ffc;
        }
        .selected-item {
            background-color: #8ECEFF;
        }
    </style>
<body>

    <!-- HTML for instance #1 of SelectionModule -->
    <div data-modules="SelectionModule" data-module-options='{"controllerId": "fruitSelection"}'>
        <ol>
            <li data-actions="fruitSelection.toggle">Apples</li>
            <li data-actions="fruitSelection.toggle">Oranges</li>
            <li data-actions="fruitSelection.toggle">Grapes</li>
        </ol>
    </div>

    <!-- HTML for instance #2 of SelectionModule -->
    <div data-modules="SelectionModule" data-module-options='{
        "controllerId": "itemSelection",
        "selectedClass": "selected-item"
    }'>
        <ol>
            <li data-actions="itemSelection.toggle">Dinner Plate</li>
            <li data-actions="itemSelection.toggle">Screwdriver</li>
            <li data-actions="itemSelection.toggle">Airplane</li>
        </ol>
    </div>

    ...
</body>
```

Here we have two instances of SelectionModule on the page, because we see two
`<div>` tags with `data-modules="SelectionModule"`.

Save this file and reload it in your browser and click on the items in each
list. You'll notice that each list gets highlighted in a different color. That's
because the HTML class name that gets toggled is taken from
`this.options.selectedClass` in our SelectionModule, and the
`data-module-options` attribute on the second `<div>` tag overrides the default
value.

Next, we'll explore some handy ways to style modules.

### Styling Modules

Foundry assigns class names to HTML tags that act as the root element for a
module. It always adds a CSS class name called `module`. Next, it takes the name
of the module that calls this element home, and constructs a CSS class name.
Since we have `data-modules="SelectionModule"`, the class names assigned to
those `<div>` tags become `module selection`.

The HTML:

```html
<div data-modules="SelectionModule">
    ...
</div>
```

Becomes this after Foundry instantiates SelectionModule on that `<div>`:

```html
<div class="module selection" data-modules-created="SelectionModule">
    ...
</div>
```

You can declare CSS styles for all modules like this:

```css
.module {
    /* Global styles for all modules */
}
```

And you can style the SelectionModule specifically using this:

```css
.module.selection {
    /* Styles only affecting selection modules */
}
```

The table below gives you an idea of the CSS class names Foundry will create
based on the JavaScript class name for a module.

<table>
    <caption>JavaScript Class and CSS Class Conventions</caption>
    <thead>
        <tr>
            <th>JavaScript Class</th>
            <th>CSS Classes</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>SelectionModule</code></td>
            <td><code>module selection</code></td>
        </tr>
        <tr>
            <td><code>Acme.Store.ShoppingCartModule</code></td>
            <td><code>module acme-store-shoppingCart</code></td>
        </tr>
    </tbody>
</table>

Let's add some CSS to our web page to style all modules, and to style the
selection modules specifically:

```html
<head>
    ...

    <style type="text/css">

        /* Styles applied to all modules */
        .module {
            border: 1px solid #000;
            border-radius: 8px;
            margin: 1em;
            padding: 0 1em;
        }

        /* Styles only applied to Selection modules */
        .module.selection ol {
            list-style-position: inside;
            margin: 1em 0;
            padding: 0;
        }
        .module.selection li {
            cursor: pointer;
        }

        /* Misc styles */
        .selected {
            background-color: #ffc;
        }
        .selected-item {
            background-color: #8ECEFF;
        }

    </style>
</head>
```

Now refresh this page in your browser.

## A Quick Recap

In this tutorial we learned how create a simple module by sub classing
`Module.Base`, which Foundry gives us for free. The `data-modules` HTML
attribute tells Foundry which modules to create, and what their root elements
will be. DOM events are mapped to methods on SelectionModule by looking at the
`data-actions` attribute in HTML and associating it with a controller Id and
method name. The `toggle` method on SelectionModule was defined as
`toggle: function click(...)`, giving that Function object in JavaScript a name
property equal to "click". This tells Foundry that the `SelectionModule#toggle`
method should only be invoked in a "click" event. Next, we saw how the
`data-module-options` attribute allows you to override the default settings in
`this.options` inside your module. Lastly, we saw how Foundry creates CSS class
names for you automatically based on the module class name.

## Up Next: Events in Foundry

Learn how to use Application and Notification events to facilitate communication
between one or more modules. Click "Next" below.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/getting-started.html" title="Back: Getting Started With Foundry">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/events-in-foundry.html" title="Next: Events In Foundry">Next</a></li>
</ul>

[starter_project]: {{ site.baseurl }}{% post_url 2014-05-05-foundry-starter-project %}
