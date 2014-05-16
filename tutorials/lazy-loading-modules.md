---
layout: default
title: Lazy Loading Modules
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Delay the loading of a module until it appears on screen. This easy
    performance enhancement can be applied to any module without any JavaScript
    code changes.
</h2>

<div class="info">
    <h3>Download The Demo</h3>

    <p class="downloads">
        <a href="{{ site.baseurl }}/tutorials/examples/lazy-loading-modules.zip" class="download-zip"
            title="Download &ldquo;Lazy Loading Modules&rdquo; Demo as a ZIP file"></a>
    </p>

    <p>
        View The Demo:
        <a href="{{ site.baseurl }}/tutorials/examples/lazy-loading-modules/">Lazy Loading Modules</a>
    </p>
</div>

By default, Foundry performs an Eager Load of all the modules on the page. Any
HTML tag with a `data-modules` attribute has those modules created and
inititalized. When the number of modules on the page increases, performance
problems can crop up during page load. Lazy loading modules comes baked in to
Foundry, and only requires a few config changes, and some additional HTML
attributes.

## What You'll Need For This Tutorial

1. The [Foundry Starter Project][starter_project]
2. A basic understanding of [how Modules work in Foundry]({{ site.baseurl }}/tutorials/introduction-to-modules.html)

## What You'll Learn

- How to configure Foundry to lazy load modules as they are scrolled into view

## Foundry Application Config Changes

There are two small changes to make in your Foundry application config:

```html
<script type="text/javascript">
    var app = Foundry.run(function(dependencies, options) {
        options.eagerLoadModules = false;
        options.lazyLoadModules = true;
    });
</script>
```

This small change to how you start your Foundry application disables the eager
loading of modules, and enables lazy loading. Upon page load, only the modules
visible inside the browser viewport will be created an initialized. You will
notice that none of your modules get created now. We have a few HTML changes to
make before Foundry will pick up those modules.

## Telling Foundry Which Modules To Lazy Load

Let's take the HTML for your Average Joe module:

```html
<div data-modules="AverageJoeModule">...</div>
```

When configured to lazy load modules, Foundry will skip over this one. We need
to tell Foundry that this module can be lazy loaded:

```html
<div data-modules="AverageJoeModule" data-module-lazyload="any">...</div>
```

The `data-module-lazyload` attribute tells Foundry the name of a DOM event that
will trigger the creation and initialization of this module. When set to `any`,
any DOM event that the module lazy loader is observing will cause Foundry to
bring this module to life. It is recommended to set the value to `any`, however
`mouseover` is also supported.

Beyond that, no additional changes to your module's JavaScript source code is
necessary, but there are a few best practices to follow for lazy loaded modules.

## Lazy Loaded Module Best Practices

- Modules should AJAX in their content. This keeps the document small on the
  initial download, and a smaller document tree in JavaScript increases overall
  JavaScript performance.
- Add two HTML class names to the root element of the lazy loaded module:
  `module` and `loading`, so that lazy loaded modules will appear in a "please
  wait..." state until they AJAX in their contents.
- In the `_ready` method, call `this._loaded();` to remove the `loading` HTML
  class from your module's root element.

__Demo:__ [Lazy Loading Modules]({{ site.baseurl }}/tutorials/examples/lazy-loading-modules/)

## Eager and Lazy Loading Modules

You don't have to choose between Eager Loading or Lazy Loading. You can do both:

```html
<script type="text/javascript">
    var app = Foundry.run(function(dependencies, options) {
        options.lazyLoadModules = true;
    });
</script>
```

In this case, you only need to enable lazy loading modules. Foundry is smart
enough to eager load a module if no `data-module-lazyload` attribute is present.

## Up Next: Responsive Modules

Responsive Design has allowed us to create CSS optimized for smaller devices,
and enabled Mobile First Design. Until now, JavaScript frameworks didn't support
the same functionality. With Foundry, you can couple Responsive Design and
Responsive Modules using CSS3 Media Queries and the `data-module-media`
attribute.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/unit-testing.html" title="Back: Unit Testing Foundry Applications">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/responsive-modules.html" title="Next: Responsive Modules Using CSS3 Media Queries">Next</a></li>
</ul>

[starter_project]: {{ site.baseurl }}{% post_url 2014-05-05-foundry-starter-project %}