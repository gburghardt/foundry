---
layout: default
title: Getting Started With Foundry
secondary_nav: getting-started
---

{% include tutorials/menu.html %}

# {{ page.title }}

This is your first stop in learning how to use Foundry. Before we start, here is
the list of what you'll need to have and know:

1. A modern web browser &mdash; Newer versions of Firefox, Chrome,
   Safari and Internet Explorer 10+ are required.
2. A [copy of Foundry](/downloads) fresh off the Intertubes.
3. A working knowledge of HTML and CSS.
4. Moderate knowledge of JavaScript, the Document Object Model, and
   object oriented JavaScript.
5. A basic understanding of the [MVC design pattern](http://martinfowler.com/eaaDev/uiArchs.html#ModelViewController).

## The HTML Boiler Plate for Foundry

Since it's hard to have a web page without HTML, let's start there. Copy the
code below and save it. You'll need to change the file paths that reference the
JavaScript files, but that's it. This is the basic boiler plate for every
Foundry application.

```html
{% include /tutorials/code/foundry_boilerplate.html %}
```

__Demo:__ [Getting Started with Foundry: The Boilerplate](/tutorials/examples/getting-started/boilerplate.html)

Great. Now we have a blank page that does nothing. Absolutely. Nothing. Let's
maje it do something.

## Building Your First Module

Building a module involves three parts: Creating the JavaScript class, adding a
reference to the class on your web page, and configuring some HTML5 attributes
to instantiate it.

First, let's define our module. It has one runtime configurable property called
`backgroundColor` which sets the background color of the Module's root element
defaulting to an orange color.

Foundry gives you a class to inherit from, called Module. This base class bakes
in many useful methods and lifecycle events.

```javascript
var WelcomeModule = Module.Base.extend({
    prototype: {
        options: {
            backgroundColor: "#ffcc99"
        },

        _ready: function() {
            Module.prototype._ready.call(this);

            this.element.innerHTML = '<p>Welcome!</p>';
            this.element.style.backgroundColor = this.options.backgroundColor;
        }
    }
});
```

Notice the two most important parts of this class: the "options" property, and
the `_ready` method.

The "options" property is a hash of runtime configurable settings. We'll see
later how HTML5 attributes can override the defaults defined in the "options"
property.

The `_ready` method takes no arguments and is the starting point for a module's
life cycle. The first line in this method calls `_ready` on the parent class. At
this point, you have a root element, all external dependencies have been met and
your module can start doing what it was designed to do.

While the `_ready` method is actually a public method, by convention methods
prefixed with an underscore are marked as "not public". This means that outside
code should never call `_ready` and that code internal to the Module class
hierarchy can.

Save this file in `modules/welcome_module.js` and add a reference to it in your
HTML file.

```html
<!-- Your Application Files -->
<script type="text/javascript" src="./modules/welcome_module.js"></script>

<script type="text/javascript">

    // Instantiation and Initialization
    var app = Foundry.run();
    ...
```

Now refresh the web page. Nothing happens. No errors. Now, it's time to bring
this thing to life.

### Instantiating a Module

The Foundry framework will instantiate and initialize the module for you. All we
need is an HTML tag with an HTML5 `data-modules` attribute. Add this HTML above
the SCRIPT tags:

```html
<body>
    <div data-modules="WelcomeModule"></div>

    <!-- Class Libraries -->
    ...
</body>
```

That's it! Foundry does the rest for you.

The `data-modules` HTML5 attribute contains the JavaScript class name you want
to instantiate. This class is a Module. The DIV tag becomes the root element for
the Module.

We've done three things with a single line of HTML:

1. Instantiate a WelcomeModule object
2. Initialize the module with the DIV tag as its root element
3. Stash the object in the Module Manager

We can find this module object by drilling down into the Foundry API. Open your
favorite browser debugging tool on the demo page, and type this into the
Console:

```javascript
app.moduleManager.groups.WelcomeModule[0]
```

That is the instance of WelcomeModule that manages user interaction in the DIV
tag with the `data-modules` attribute.

### Multiple Instances of the Same Module

Let's create another WelcomeModule:

```html
<body>
    <div data-modules="WelcomeModule"></div>
    <div data-modules="WelcomeModule" data-module-options='{"backgroundColor": "#f0f0f0"}'></div>

    <!-- Class Libraries -->
    ...
</body>
```

This second instance also has a `data-module-options` attribute, which overrides
the `backgroundColor` option. Refresh the page and you'll see two Welcome
modules. One orange, the other gray.

Use the `data-module-options` attribute to override default values in the
"options" property of your modules. This becomes a handy way to propagate data
from a server side application and inject it into JavaScript in the browser.

With the browser Console window open again, type this:

```javascript
app.moduleManager.groups.WelcomeModule[1]
```

There's the second instance of WelcomeModule!

## The Complete Example

The completed HTML file should look like this:

```html
{% include tutorials/code/final.html %}
```

__Demo:__ [Getting Started With Foundry: Your First Module](/tutorials/examples/getting-started/final.html)

That's all there is to it.

<ul class="pagination">
    <li class="pagination-back"><span>Back</span></li>
    <li class="pagination-up"><a href="/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="/tutorials/introduction-to-modules.html" title="Next: Introduction to Modules">Next</a></li>
</ul>