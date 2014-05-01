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

By default, Foundry performs an Eager Load of all the modules on the page. Any
HTML tag with a `data-modules` attribute has those modules created and
inititalized. When the number of modules on the page increases, performance
problems can crop up during page load. Lazy loading modules comes baked in to
Foundry, and only requires a few config changes, and some additional HTML
attributes.

## What You'll Need For This Tutorial

1. [Foundry](/downloads.html)
2. A basic understanding of [how Modules work in Foundry](/tutorials/introduction-to-modules.html)

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

__Demo:__ [Lazy Loading Modules](/tutorials/examples/lazy-loading-modules/)

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

__Demo:__ [Eager and Lazy Loading Modules](http://localhost:4000/tutorials/examples/lazy-loading-modules/eager-and-lazy-loading.html)

## Up Next: Integrating Pollyfills With Foundry

Foundry wasn't built with older browsers in mind, which means many older
browsers aren't supported. The next tutorial shows you how to enable support for
older browsers using Pollyfills.

<ul class="pagination">
    <li class="pagination-back"><a href="/tutorials/responsive-modules.html" title="Back: Responsive Modules Using CSS3 Media Queries">Back</a></li>
    <li class="pagination-up"><a href="/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="/tutorials/integrating-pollyfills.html" title="Next: Integrating Pollyfills With Foundry">Next</a></li>
</ul>
