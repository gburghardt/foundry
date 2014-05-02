---
layout: default
title: Creating New Modules On The Fly
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Not every module will exist in the HTML file at page load. Sometimes you
    need to create new modules as a result of a user clicking on a button or
    link. Foundry gives you an easy way to do this.
</h2>

<div class="info">
    <p>You can view the demo here: <a href="{{ site.baseurl }}/tutorials/examples/new-modules-on-the-fly/">New Modules On The Fly</a></p>
</div>

## What You'll Need For This Tutorial

1. [Foundry]({{ site.baseurl }}/downloads.html)
2. A basic understanding of [how Modules work in Foundry]({{ site.baseurl }}/tutorials/introduction-to-modules.html)

## Basics Of Dynamically Creating New Modules

Foundry comes with functionality to create and append new modules to the
document at runtime when the user clicks on a button or link. It allows you to
render a client side template to get the initial HTML for the new modules, as
well as giving you all the configuration options available elsewhere in Foundry.

<h3 class="code-label">HTML For Creating New Modules</h3>

```html
<button
    data-actions="newModules.createModule"
    data-action-params='{
        "newModules.createModule": {
            "module": {
                "type": "FooModule",
                "options": {
                    "foo": "bar"
                },
                "template": "foo"
            },
            "container": {
                "selector": ".main",
                "renderData": {
                    "title": "Foo"
                }
            }
        }
    }'
>New Module</button>
```

There are two main pieces:

1. The `data-actions` attribute must have a value of `newModules.createModule`
   &mdash; this is baked in to Foundry.
2. The `data-action-params` attribute is required, and provides information to
   construct the new module.

The `data-action-params` attribute must be in this format:

<h3 class="code-label">Structure of <code>data-action-params</code></h3>

```javascript
{
    "newModules.createModule": {
        "module": {
            "type": "FooModule", // What would normally go in data-modules attribute
            "options": {
                // What would normally go in data-module-options attribute
            },
            "template": "foo" // <script type="text/html" data-template="foo" />
        },
        "element": {
            "tag": "DIV" // Tag name of module's root element
        },
        "container": {
            "selector": ".foo", // Element that should contain the new module
            "insert": "bottom|top", // Where to insert new module in container
            "renderData": {
                // Arbitrary data used to render the new module
            }
        }
    }
}
```

- `module` (Object), Required: Metadata about the new module
  - `type` (String), Required: The module's JavaScript class name, or the dependency name in the
    Foundry container. This is what normally goes in the `data-modules`
    attribute when modules are embedded in the HTML.
  - `options` (Object), Optional: Overrides for `this.options` in the new module. This is what
    normally goes in the `data-module-options` attribute for embedded modules
  - `template` (String), Required: The name of a client side template to render. This gets matched
    to a SCRIPT tag. If `template` is "foo", then Foundry tries to find a SCRIPT
    tag like this: `<script type="text/html" data-template="foo"></script>`.
    Foundry assumes this contains the initial markup for the module.
- `element` (Object), Optional: Metadata about the root element for the new
   module.
  - `tag` (String), Optional: The HTML tag name to create. The default is "div".
    This value is passed directly into `document.createElement(...)`.
- `container` (Object), Required: Metadata about the HTML element that will contain the new module
  - `selector` (String), Required: The CSS selector used to identify the HTML
    element that will contain this new module
  - `insert` (String), Optional: Where to insert the module in its container.
    Valid values are: `top` (default), and `bottom`.
  - `renderData` (Object), Optional: An arbitrary key-value hash of data used
    to render the HTML for the new module.

### Rendering the Client Side Template

The client side template is just a special `<script>` tag on the page. It uses
a very simple template language with tags like `#{foo}`, where `foo` is a key in
the `renderData`. Foundry gives you several pieces of data by default:

- `guid`: The GUID for this module, which is unique amongst all the modules on
  this page
- `createdAt`: The current Date in string form
- `timestamp`: The current Date as a timestamp
- `controllerId`: The controller Id registered with the Foundry front
  controller. You will need this when constructing values for the `data-actions`
  attributes

```html
<script type="text/html" data-template="foo">
    Date: #{createdAt}<br>
    GUID: #{guid}<br>
    Timestamp: #{timestamp}<br>
    <button data-actions="#{controllerId}.addItem">Add Item</button>
</script>
```

The `renderData` in the `data-action-params` extends the data used to render the
client side template.

## A Quick Recap

Foundry automates the process of creating new modules at runtime. Any element on
the page with `data-actions="newModules.createModule"` will trigger this
behavior. The `data-action-params` attribute contains metadata about the new
module, including the module type, runtime configurable options, the root
root element that Foundry should create, and the location on the page where the
new module gets inserted.

## What's Next?

This is the last tutorial for Foundry. More are in the works, but for now
[download Foundry][0] and start playing around. You can always
[view all tutorials][1], or [browse the code][2]. Check out the
[Foundry Blog][3] for news, updates and how-to guides.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/integrating-pollyfills.html" title="Back: Integrating Pollyfills With Foundry">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><span>Next</span></li>
</ul>

[0]: {{ site.baseurl }}/downloads.html
[1]: {{ site.baseurl }}/tutorials/
[2]: https://github.com/gburghardt/foundry/
[3]: {{ site.baseurl }}/blog/
