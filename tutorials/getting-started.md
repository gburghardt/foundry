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
2. The [Foundry Starter Project][downloads]
3. A working knowledge of HTML and CSS.
4. Moderate knowledge of JavaScript, the Document Object Model, and
   object oriented JavaScript.
5. A basic understanding of the [MVC design pattern](http://martinfowler.com/eaaDev/uiArchs.html#ModelViewController).

## The Foundry Starter Project

The Foundry Starter Project is the easiest way to start building a Foundry
application. It gives you the basic scaffolding and markup structure.

1. [Download the Foundry Starter Project][downloads]
2. Unzip the zip file and open this directory up in the command line
3. Run `npm install` to install all the Node.js dependencies. You will need this
   in order to concatenate and minify the JavaScript files.
4. Copy `.bowerrc_example` to `.bowerrc`
5. Run `bower install` to pull down all the dependencies for Foundry.
6. Configure a web server on your computer to serve the root directory of this
   project.
7. Open `index.html` in a browser. You should see a page with two "Welcome to
   Foundry!" modules

## Building Your First Module

Building a module involves three parts: Creating the JavaScript class, adding a
reference to the class on your web page, and configuring some HTML5 attributes
to instantiate it.

First, let's define our module. It has one runtime configurable property called
`backgroundColor` which sets the background color of the Module's root element
defaulting to an orange color.

Foundry gives you a class to inherit from, called Module. This base class bakes
in many useful methods and lifecycle events.

First, create a new file: `app/modules/hello_world_module.js`

<h3 class="code-label">app/modules/hello_world_module.js</h3>

```javascript
var HelloWorldModule = Module.Base.extend({
    prototype: {
        options: {
            backgroundColor: "#f0f0f0"
        },

        _ready: function() {
            Module.Base.prototype._ready.call(this);

            this.element.innerHTML = '<h1>Hello, World!</h1>';
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

Now add this new file to `config/files.json` in the "application" section:

<h3 class="code-label">config/files.json</h3>

```javascript
{
    ...

    "application": [
        "app/models/welcome.js",
        "app/modules/welcome_module.js",
        "app/modules/hello_world_module.js"
    ]
}
```

Next we need to rebuild the JavaScript files. From the command line:

```
foundry-starter-project $ grunt
```

This will create the concatenated and minified files, including the new
HelloWorldModule you just created. Now, it's time to bring this thing to life.

### Instantiating a Module

The Foundry framework will instantiate and initialize the module for you. All we
need is an HTML tag with an HTML5 `data-modules` attribute. Add this HTML just
inside the `<body>` tag in `index.html`:

<h4 class="code-label">index.html</h4>

```html
<body>
    <div data-modules="HelloWorldModule"></div>

    ...
</body>
```

That's it! Foundry does the rest for you.

The `data-modules` HTML5 attribute contains the JavaScript class name you want
to instantiate. This class is a Module. The DIV tag becomes the root element for
the Module.

We've done three things with a single line of HTML:

1. Instantiate a HelloWorldModule object
2. Initialize the module with the DIV tag as its root element
3. Stash the object in the Module Manager

We can find this module object by drilling down into the Foundry API. Open your
favorite browser debugging tool on the demo page, and type this into the
Console:

```javascript
app.moduleManager.groups.HelloWorldModule[0]
```

That is the instance of HelloWorldModule that manages user interaction in the
DIV tag with the `data-modules` attribute.

### Multiple Instances of the Same Module

Let's create another HelloWorldModule:

<h4 class="code-label">index.html</h4>

```html
<body>
    <div data-modules="HelloWorldModule"></div>
    <div data-modules="HelloWorldModule" data-module-options='{"backgroundColor": "#ffc"}'></div>

    ...
</body>
```

This second instance also has a `data-module-options` attribute, which overrides
the `backgroundColor` option. Refresh the page and you'll see two
HelloWorldModule's One yellow, the other gray.

Use the `data-module-options` attribute to override default values in the
"options" property of your modules. This becomes a handy way to propagate data
from a server side application and inject it into JavaScript in the browser.

With the browser Console window open again, type this:

```javascript
app.moduleManager.groups.HelloWorldModule[1]
```

There's the second instance of HelloWorldModule!

<ul class="pagination">
    <li class="pagination-back"><span>Back</span></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/introduction-to-modules.html" title="Next: Introduction to Modules">Next</a></li>
</ul>

[downloads]: /{{ site.baseurl }}/downloads.html
