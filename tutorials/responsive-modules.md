---
layout: default
title: Responsive Modules Using CSS3 Media Queries
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
	Responsive Design and CSS Media Queries have enabled Mobile First Design.
	With Foundry, your JavaScript can be just as responsive and Mobile First as
	your CSS.
</h2>

## What You'll Need For This Tutorial

1. [Foundry](/downloads.html)
2. A basic understanding of [how Modules work in Foundry](/tutorials/introduction-to-modules.html)
3. Moderate knowledge of [Responsive Design][0] and [CSS Media Queries][1].

## What You'll Learn

- What defines a "Responsive Module"
- When to use Responsive Modules
- How to load modules based on viewport dimensions
- Some best practices to ensure Responsive Modules show up when intended
- How to eager or lazy load Responsive Modules
- Which browsers support Responsive Modules

## What Is A Responsive Module?

<div class="aside">
    You can view a demo of eager and lazy loaded Responsive Modules here:
    <a href="/tutorials/examples/responsive-modules/">Responsive Modules</a>
</div>

Responsive Modules are just like every other module you create for Foundry,
except they only get loaded by the framework if the `data-module-media`
attribute matches the current viewport dimensions.

Not every module we build would look good or even function well on every screen
size. With that in mind, you are free to create as big and complex a module as
you need to solve the problem. If it brings mobile devices to their knees, no
big deal:

> Hey Foundry, only load this module on 1000px and wider screens

```html
<div data-modules="ComplexModule" data-module-media="screen and (min-width: 1000px)"></div>
```

You may also have a small, simple module that works well for small devices, but
adds little value to larger ones:

> Hey Foundry, only load this module on 300px and narrower screens

```html
<div data-modules="MiniModule" data-module-media="screen and (max-width: 300px)"></div>
```

You can do all this, and still mix in modules that work across the board:

```html
<div data-modules="MiniModule" data-module-media="screen and (max-width: 300px)"></div>

<div data-modules="GoldilocksModule">
	I'm not too hot and not too cold!
</div>

<div data-modules="ComplexModule" data-module-media="screen and (min-width: 1000px)"></div>
```

## Responsive Module Best Practices

When creating Responsive Modules, you must bear in mind that those modules might
not always need to appear on screen. Given that, you should follow these
guidelines when making a module responsive:

- Use CSS to hide the module root elements until needed:

    ```html
    <div class="foo"
        data-modules="ComplexModule"
        data-module-media="screen and (min-width: 1000px)"></div>

    <style type="text/css">
        @media screen and (max-width: 999px) {
            .foo {
                display: none;
            }

            /* OR */

            *[data-modules~=ComplexModule][data-module-media] {
                display: none;
            }
        }
    </style>
    ```

- Send an AJAX request to fill the module contents in the `_ready` method. This
  keeps the document tree small, increasing performance on smaller devices.

- Try to omit the JavaScript source code for modules that will not be loaded.

## Eager and Lazy Loading Responsive Modules

Responsive Modules can be Eager or Lazy Loaded by Foundry just like any other
module:

```html
<!-- Eager Load -->
<div class="foo"
    data-modules="ComplexModule"
    data-module-media="screen and (min-width: 1000px)"></div>

<!-- Lazy Load -->
<div class="foo"
    data-modules="ComplexModule"
    data-module-media="screen and (min-width: 1000px)"
    data-module-lazyload="any"></div>
```

__Demo:__ [Responsive Modules](/tutorials/examples/responsive-modules/)

## Browser Support For Responsive Modules

Foundry uses the native `matchMedia` method available in newer browsers:

- Internet Explorer 10+
- Firefox 6+
- Chrome 9+
- Opera 12.1+
- Safari 5.1+

Source: [matchMedia Browser Compatibility (MDN)][2]

A JavaScript error will get thrown in older browsers, referring to a Pollyfill
that can be utilized to enable this feature.

## Up Next: Integrating Pollyfills With Foundry

Foundry wasn't built with older browsers in mind, which means many older
browsers aren't supported. The next tutorial shows you how to enable support for
older browsers using Pollyfills. We'll explore this by enabling Responsive
Modules for browsers that do not support the `matchMedia` function in
JavaScript.

<ul class="pagination">
    <li class="pagination-back"><a href="/tutorials/lazy-loading-modules.html" title="Back: Lazy Loading Modules">Back</a></li>
    <li class="pagination-up"><a href="/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="/tutorials/integrating-pollyfills.html" title="Next: Integrating Pollyfills With Foundry">Next</a></li>
</ul>

[0]: http://alistapart.com/topic/responsive-design
[1]: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Media_queries
[2]: https://developer.mozilla.org/en-US/docs/Web/API/Window.matchMedia#Browser_compatibility
